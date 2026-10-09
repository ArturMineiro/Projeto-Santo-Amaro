<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResidentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_creates_resident_without_password(): void
    {
        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);

        $this->actingAs($admin->user)->postJson('/api/admin/residents', [
            'name' => 'Dona Benedita',
            'phone' => '(11) 93333-2222',
            'unit' => 'Rua B, 45',
        ])->assertCreated()
            ->assertJsonPath('resident.status', 'approved')
            ->assertJsonPath('resident.user.has_access', false)
            ->assertJsonPath('resident.user.phone_formatted', '(11) 93333-2222');

        $this->actingAs($admin->user)->postJson('/api/admin/residents', [
            'name' => 'Duplicado',
            'phone' => '11933332222',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_admin_links_existing_user_from_other_association(): void
    {
        $a = $this->makeAssociation();
        $b = $this->makeAssociation();
        $adminB = $this->makeMember($b, Membership::ROLE_ADMIN);
        $memberA = $this->makeMember($a);

        $this->actingAs($adminB->user)->postJson('/api/admin/residents', [
            'name' => 'Qualquer',
            'phone' => $memberA->user->phone,
        ])->assertCreated();

        $this->assertSame(2, $memberA->user->memberships()->count());
        $this->assertSame(1, User::where('phone', $memberA->user->phone)->count());
    }

    public function test_search_by_name_unit_and_phone(): void
    {
        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN, ['name' => 'Admin']);
        $m = $this->makeMember($association, userAttributes: ['name' => 'José Carlos', 'phone' => '5511912345678']);
        $m->update(['unit' => 'Quadra 3']);

        $this->actingAs($admin->user);
        $this->getJson('/api/admin/residents?search=josé')->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/residents?search=quadra')->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/residents?search=1234-5678')->assertJsonCount(1, 'data');
    }

    public function test_approve_and_reject(): void
    {
        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $p1 = $this->makeMember($association, status: Membership::STATUS_PENDING);
        $p2 = $this->makeMember($association, status: Membership::STATUS_PENDING);

        $this->actingAs($admin->user);
        $this->postJson("/api/admin/residents/{$p1->id}/approve")->assertOk()->assertJsonPath('resident.status', 'approved');
        $this->postJson("/api/admin/residents/{$p2->id}/reject", ['rejection_reason' => 'Não mora aqui'])
            ->assertOk()->assertJsonPath('resident.status', 'rejected');

        $this->actingAs($p1->user)->getJson('/api/my/packages')->assertOk();
        $this->actingAs($p2->user)->getJson('/api/my/packages')->assertForbidden();
    }

    public function test_cannot_remove_last_admin_or_resident_with_waiting_packages(): void
    {
        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $resident = $this->makeMember($association);

        $this->actingAs($admin->user);
        $this->patchJson("/api/admin/residents/{$admin->id}", ['role' => 'resident'])->assertStatus(422);
        $this->deleteJson("/api/admin/residents/{$admin->id}")->assertStatus(422);

        $this->postJson('/api/admin/packages', ['membership_id' => $resident->id, 'notify' => false])->assertCreated();
        $this->deleteJson("/api/admin/residents/{$resident->id}")->assertStatus(422);
    }

    public function test_admin_cannot_change_personal_data_of_resident_with_access(): void
    {
        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $resident = $this->makeMember($association, userAttributes: ['phone' => '5511911112222']);

        $this->actingAs($admin->user)->patchJson("/api/admin/residents/{$resident->id}", [
            'phone' => '11999990000',
            'unit' => 'Casa 99',
        ])->assertOk()->assertJsonPath('resident.unit', 'Casa 99');

        $this->assertSame('5511911112222', $resident->user->fresh()->phone);
    }

    public function test_invite_code_is_admin_only_and_can_be_regenerated(): void
    {
        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $resident = $this->makeMember($association);

        $this->actingAs($resident->user)->getJson('/api/association')->assertOk()->assertJsonMissingPath('invite_code');

        $old = $association->invite_code;
        $new = $this->actingAs($admin->user)->postJson('/api/admin/association/invite-code')->assertOk()->json('association.invite_code');

        $this->assertNotSame($old, $new);
        $this->getJson("/api/invites/{$old}")->assertNotFound();
    }
}
