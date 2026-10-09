<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Package extends Model
{
    public const STATUS_RECEIVED = 'received';
    public const STATUS_PICKED_UP = 'picked_up';

    public const TYPES = ['package', 'letter', 'document', 'other'];

    public const TYPE_LABELS = [
        'package' => 'pacote',
        'letter' => 'carta',
        'document' => 'documento',
        'other' => 'encomenda',
    ];

    protected $fillable = [
        'association_id',
        'resident_id',
        'membership_id',
        'registered_by',
        'type',
        'description',
        'carrier',
        'tracking_code',
        'notes',
        'status',
        'pickup_code',
        'arrived_at',
        'notified_at',
        'picked_up_at',
        'picked_up_by_name',
        'delivered_by',
    ];

    protected $casts = [
        'arrived_at' => 'datetime',
        'notified_at' => 'datetime',
        'picked_up_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Package $package) {
            $package->pickup_code ??= (string) random_int(1000, 9999);
            $package->arrived_at ??= now();
            $package->status ??= self::STATUS_RECEIVED;
        });
    }

    public function association(): BelongsTo
    {
        return $this->belongsTo(Association::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    public function membership(): BelongsTo
    {
        return $this->belongsTo(Membership::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function deliveredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivered_by');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(PackageNotification::class)->latest('id');
    }

    public function scopeWaiting(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_RECEIVED);
    }

    public function isWaiting(): bool
    {
        return $this->status === self::STATUS_RECEIVED;
    }

    public function typeLabel(): string
    {
        return self::TYPE_LABELS[$this->type] ?? 'encomenda';
    }
}
