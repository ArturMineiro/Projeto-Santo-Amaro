<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_association_registration_creates_admin(): void
    {
        $response = $this->postJson('/api/auth/register-association', [
            'association_name' => 'Associação Vila Nova',
            'name' => 'Maria Souza',
            'phone' => '(11) 98888-7777',
            'password' => 'segredo1',
            'password_confirmation' => 'segredo1',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'phone'], 'memberships'])
            ->assertJsonPath('user.phone', '5511988887777')
            ->assertJsonPath('memberships.0.role', 'admin')
            ->assertJsonPath('memberships.0.status', 'approved');

        $this->assertNotEmpty($response->json('memberships.0.association.invite_code'));
    }

    public function test_resident_signs_up_with_invite_code_and_waits_for_approval(): void
    {
        $association = $this->makeAssociation(['invite_code' => 'ABC234']);

        $this->getJson('/api/invites/abc234')->assertOk()->assertJsonPath('name', 'Associação Teste');

        $response = $this->postJson('/api/auth/register', [
            'invite_code' => 'abc234',
            'name' => 'João Pereira',
            'phone' => '11977776666',
            'unit' => 'Casa 8',
            'password' => 'segredo1',
            'password_confirmation' => 'segredo1',
        ]);

        $response->assertCreated()->assertJsonPath('memberships.0.status', 'pending');
        // Morador não vê código de convite
        $this->assertNull($response->json('memberships.0.association.invite_code'));

        $token = $response->json('token');
        $this->withToken($token)->getJson('/api/my/packages')->assertForbidden();
    }

    public function test_resident_claims_account_created_by_admin(): void
    {
        $association = $this->makeAssociation();
        $member = $this->makeMember($association, userAttributes: ['password' => null, 'phone' => '5511955554444']);

        $this->postJson('/api/auth/register', [
            'invite_code' => $association->invite_code,
            'name' => 'Nome Atualizado',
            'phone' => '(11) 95555-4444',
            'password' => 'segredo1',
            'password_confirmation' => 'segredo1',
        ])->assertCreated()->assertJsonPath('memberships.0.status', 'approved');

        $this->assertSame(1, User::where('phone', '5511955554444')->count());
        $this->assertSame('Nome Atualizado', $member->user->fresh()->name);
    }

    public function test_cannot_claim_phone_that_already_has_password(): void
    {
        $association = $this->makeAssociation();
        $this->makeMember($association, userAttributes: ['phone' => '5511955554444']);

        $this->postJson('/api/auth/register', [
            'invite_code' => $association->invite_code,
            'name' => 'Intruso',
            'phone' => '11955554444',
            'password' => 'segredo1',
            'password_confirmation' => 'segredo1',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_login_by_phone_in_any_format_and_by_email(): void
    {
        $association = $this->makeAssociation();
        $this->makeMember($association, userAttributes: ['phone' => '5511944443333', 'email' => 'x@example.com']);

        $this->postJson('/api/auth/login', ['login' => '(11) 94444-3333', 'password' => 'password'])
            ->assertOk()->assertJsonStructure(['token']);

        $this->postJson('/api/auth/login', ['login' => 'x@example.com', 'password' => 'password'])
            ->assertOk();

        $this->postJson('/api/auth/login', ['login' => '11944443333', 'password' => 'errada'])
            ->assertStatus(422)->assertJsonValidationErrors('login');
    }

    public function test_user_without_password_cannot_login(): void
    {
        $association = $this->makeAssociation();
        $this->makeMember($association, userAttributes: ['phone' => '5511944443333', 'password' => null]);

        $this->postJson('/api/auth/login', ['login' => '11944443333', 'password' => ''])
            ->assertStatus(422);
    }

    public function test_profile_update_and_password_change(): void
    {
        $association = $this->makeAssociation();
        $member = $this->makeMember($association);

        $this->actingAs($member->user)->patchJson('/api/auth/profile', [
            'notify_email' => false,
            'password' => 'novasenha',
            'password_confirmation' => 'novasenha',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->actingAs($member->user)->patchJson('/api/auth/profile', [
            'notify_email' => false,
            'current_password' => 'password',
            'password' => 'novasenha',
            'password_confirmation' => 'novasenha',
        ])->assertOk()->assertJsonPath('user.notify_email', false);
    }

    public function test_unauthenticated_gets_json_401(): void
    {
        $this->get('/api/auth/me')->assertStatus(401)->assertJsonStructure(['message']);
    }

    public function test_pending_member_listing(): void
    {
        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $this->makeMember($association, status: Membership::STATUS_PENDING);

        $this->actingAs($admin->user)->getJson('/api/admin/residents?status=pending')
            ->assertOk()->assertJsonCount(1, 'data');
    }
}
