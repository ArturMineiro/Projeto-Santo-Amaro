<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Package extends Model
{
    protected $fillable = [
        'association_id',
        'resident_id',
        'received_by',
        'description',
        'tracking_code',
        'status',
        'arrival_date',
        'notification_sent_at',
        'picked_up_at',
    ];

    protected $casts = [
        'arrival_date' => 'datetime',
        'notification_sent_at' => 'datetime',
        'picked_up_at' => 'datetime',
    ];

    public function association(): BelongsTo
    {
        return $this->belongsTo(Association::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}