<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\User;
use App\Services\AppLogReader;
use App\Services\PackageNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SystemTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_super_admin' => true])->save();

        return $user;
    }

    public function test_only_super_admin_can_access(): void
    {
        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);

        $this->actingAs($admin->user)->getJson('/api/system/overview')->assertForbidden();
        $this->actingAs($this->superAdmin())->getJson('/api/system/overview')
            ->assertOk()
            ->assertJsonStructure(['totals' => ['associations', 'packages_waiting'], 'notifications_7d', 'packages_per_day', 'system' => ['php_version', 'database'], 'warnings'])
            ->assertJsonCount(14, 'packages_per_day');
    }

    public function test_cannot_become_super_admin_through_profile(): void
    {
        $association = $this->makeAssociation();
        $member = $this->makeMember($association);

        $this->actingAs($member->user)->patchJson('/api/auth/profile', ['is_super_admin' => true])->assertOk();
        $this->assertFalse($member->user->fresh()->is_super_admin);
    }

    public function test_search_associations_and_see_memberships(): void
    {
        $a = $this->makeAssociation(['name' => 'Vila Esperança']);
        $this->makeAssociation(['name' => 'Jardim Azul']);
        $this->makeMember($a, Membership::ROLE_ADMIN, ['name' => 'Joana Admin', 'phone' => '5511933332222']);
        $this->makeMember($a, status: Membership::STATUS_PENDING);

        $this->actingAs($this->superAdmin());
        $this->getJson('/api/system/associations')->assertJsonPath('meta.total', 2);
        $this->getJson('/api/system/associations?search=esperan')->assertJsonCount(1, 'data')->assertJsonPath('data.0.pending_count', 1);
        // Busca pelo nome ou telefone de quem administra
        $this->getJson('/api/system/associations?search=joana')->assertJsonCount(1, 'data');
        $this->getJson('/api/system/associations?search=3333-2222')->assertJsonCount(1, 'data');

        $this->getJson("/api/system/associations/{$a->id}")
            ->assertOk()
            ->assertJsonPath('invite_code', $a->invite_code)
            ->assertJsonCount(2, 'memberships');

        $this->getJson('/api/system/memberships?status=pending')->assertJsonCount(1, 'data');
        $this->getJson('/api/system/memberships?search=joana')->assertJsonPath('data.0.association.name', 'Vila Esperança');
    }

    public function test_deactivating_association_blocks_its_panel_and_is_logged(): void
    {
        $a = $this->makeAssociation();
        $admin = $this->makeMember($a, Membership::ROLE_ADMIN);
        $super = $this->superAdmin();

        $this->actingAs($super)->patchJson("/api/system/associations/{$a->id}", ['is_active' => false])->assertOk();
        $this->actingAs($admin->user)->getJson('/api/admin/dashboard')->assertForbidden();

        $this->actingAs($super)->getJson('/api/system/activity?action=association')
            ->assertJsonPath('data.0.action', 'association.deactivated');
    }

    public function test_actions_are_recorded_in_activity_log(): void
    {
        Mail::fake();
        $this->app->bind(PackageNotifier::class, fn () => new PackageNotifier(null));

        $a = $this->makeAssociation();
        $admin = $this->makeMember($a, Membership::ROLE_ADMIN, ['phone' => '5511944443333']);
        $resident = $this->makeMember($a, userAttributes: ['email' => 'r@example.com']);

        $this->postJson('/api/auth/login', ['login' => '11944443333', 'password' => 'Zq9-wrong-pw'])->assertStatus(422);
        $this->postJson('/api/auth/login', ['login' => '11944443333', 'password' => 'password'])->assertOk();

        $id = $this->actingAs($admin->user)->postJson('/api/admin/packages', ['membership_id' => $resident->id, 'carrier' => 'TikTok Shop'])
            ->assertCreated()->assertJsonPath('package.carrier', 'TikTok Shop')->json('package.id');
        $this->postJson("/api/admin/packages/{$id}/pickup")->assertOk();

        $actions = $this->actingAs($this->superAdmin())->getJson('/api/system/activity')->json('data.*.action');
        $this->assertSame(['package.picked_up', 'package.created', 'auth.login', 'auth.login_failed'], $actions);

        // A senha errada nunca vai para o log, e o telefone aparece mascarado
        $failed = $this->getJson('/api/system/activity?action=auth.login_failed')->json('data.0.description');
        $this->assertStringNotContainsString('Zq9-wrong-pw', $failed);
        $this->assertStringNotContainsString('5511944443333', $failed);

        $this->getJson('/api/system/notifications?channel=email')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.association.id', $a->id);
    }

    public function test_app_log_reader_parses_entries(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'log');
        file_put_contents($path, implode("\n", [
            '[2026-10-09 10:00:00] testing.INFO: Primeira mensagem',
            '[2026-10-09 10:01:00] testing.ERROR: Deu ruim {"x":1}',
            '#0 stack linha 1',
            '#1 stack linha 2',
            '[2026-10-09 10:02:00] testing.WARNING: Atenção aqui',
        ]));
        $this->app->instance(AppLogReader::class, new AppLogReader($path));

        $this->actingAs($this->superAdmin());
        $entries = $this->getJson('/api/system/app-log')->assertOk()->json('data');
        $this->assertCount(3, $entries);
        $this->assertSame('warning', $entries[0]['level']);
        $this->assertStringContainsString('stack linha 2', $entries[1]['details']);

        $this->getJson('/api/system/app-log?level=error')->assertJsonCount(1, 'data');
        $this->getJson('/api/system/app-log?search=primeira')->assertJsonCount(1, 'data');

        unlink($path);
    }

    public function test_artisan_command_creates_and_promotes(): void
    {
        $this->artisan('sistema:admin', ['telefone' => '(11) 97777-6666', '--senha' => 'senhaforte1'])->assertExitCode(0);
        $user = User::where('phone', '5511977776666')->first();
        $this->assertTrue($user->is_super_admin);

        $this->postJson('/api/auth/login', ['login' => '11977776666', 'password' => 'senhaforte1'])
            ->assertOk()->assertJsonPath('user.is_super_admin', true);

        $this->artisan('sistema:admin', ['telefone' => '11977776666', '--remover' => true])->assertExitCode(0);
        $this->assertFalse($user->fresh()->is_super_admin);
    }
}
