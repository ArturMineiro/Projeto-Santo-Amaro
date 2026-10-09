<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Association extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'invite_code',
        'phone',
        'email',
        'address',
        'pickup_hours',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function packages(): HasMany
    {
        return $this->hasMany(Package::class);
    }

    /**
     * Código fácil de ditar por telefone: sem 0/O/1/I para evitar confusão.
     */
    public static function generateInviteCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        do {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (static::where('invite_code', $code)->exists());

        return $code;
    }

    public static function generateSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'associacao';
        $slug = $base;

        while (static::where('slug', $slug)->exists()) {
            $slug = $base . '-' . Str::lower(Str::random(4));
        }

        return $slug;
    }
}
