<?php

namespace Tests;

use App\Models\Association;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function makeAssociation(array $attributes = []): Association
    {
        return Association::create(array_merge([
            'name' => 'Associação Teste',
            'slug' => 'teste-' . uniqid(),
            'invite_code' => Association::generateInviteCode(),
            'pickup_hours' => 'Seg a sex, 8h às 18h',
        ], $attributes));
    }

    protected function makeMember(Association $association, string $role = Membership::ROLE_RESIDENT, array $userAttributes = [], string $status = Membership::STATUS_APPROVED): Membership
    {
        $user = User::factory()->create($userAttributes);

        return Membership::create([
            'association_id' => $association->id,
            'user_id' => $user->id,
            'role' => $role,
            'status' => $status,
            'unit' => 'Casa ' . random_int(1, 99),
            'approved_at' => $status === Membership::STATUS_APPROVED ? now() : null,
        ])->load('user');
    }
}
