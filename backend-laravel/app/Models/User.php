<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        // is_super_admin fica de fora de propósito: só via forceFill (comando sistema:admin)
        'is_active',
        'notify_whatsapp',
        'notify_email',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
            'is_active' => 'boolean',
            'notify_whatsapp' => 'boolean',
            'notify_email' => 'boolean',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function packages(): HasMany
    {
        return $this->hasMany(Package::class, 'resident_id');
    }

    public function hasPassword(): bool
    {
        return ! empty($this->getAuthPassword());
    }

    /** Primeiro nome para mensagens. Pula pronomes: "Dona Benedita Souza" -> "Benedita". */
    public function firstName(): string
    {
        $parts = preg_split('/\s+/', trim($this->name)) ?: [];
        $honorifics = ['dona', 'd.', 'seu', 'sr', 'sr.', 'sra', 'sra.', 'srta', 'srta.', 'dr', 'dr.', 'dra', 'dra.'];

        while (count($parts) > 1 && in_array(mb_strtolower($parts[0]), $honorifics, true)) {
            array_shift($parts);
        }

        return $parts[0] ?? $this->name;
    }
}
