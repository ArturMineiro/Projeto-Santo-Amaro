<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            // 55 + DDD + 9 + 8 dígitos
            'phone' => '55' . fake()->numberBetween(11, 99) . '9' . fake()->unique()->numerify('########'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /** Morador cadastrado pela associação, ainda sem acesso próprio. */
    public function withoutAccess(): static
    {
        return $this->state(fn () => ['password' => null, 'email' => null]);
    }
}
