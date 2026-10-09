<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackageNotification extends Model
{
    public const CHANNEL_WHATSAPP = 'whatsapp';
    public const CHANNEL_EMAIL = 'email';

    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';

    /** Aviso feito pela administração no próprio WhatsApp (link wa.me), sem provedor pago. */
    public const PROVIDER_MANUAL = 'manual';

    protected $fillable = [
        'package_id',
        'channel',
        'status',
        'recipient',
        'provider',
        'provider_message_id',
        'error',
    ];

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }
}
