<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'association_id',
        'action',
        'description',
        'subject_type',
        'subject_id',
        'ip',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function association(): BelongsTo
    {
        return $this->belongsTo(Association::class);
    }
}
