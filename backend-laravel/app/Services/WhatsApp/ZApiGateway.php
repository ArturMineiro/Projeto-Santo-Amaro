<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Z-API — https://developer.z-api.io/
 * POST https://api.z-api.io/instances/{instance}/token/{token}/send-text
 */
class ZApiGateway implements WhatsAppGateway
{
    public function __construct(
        private readonly string $instance,
        private readonly string $token,
        private readonly ?string $clientToken = null,
    ) {
    }

    public function send(string $phone, string $message): ?string
    {
        $url = "https://api.z-api.io/instances/{$this->instance}/token/{$this->token}/send-text";

        try {
            $response = Http::timeout(15)
                ->withHeaders(array_filter(['Client-Token' => $this->clientToken]))
                ->post($url, ['phone' => $phone, 'message' => $message]);
        } catch (ConnectionException $e) {
            throw new WhatsAppException('Z-API indisponível: ' . $e->getMessage(), previous: $e);
        }

        if ($response->failed()) {
            throw new WhatsAppException("Z-API respondeu {$response->status()}: " . $response->body());
        }

        return $response->json('messageId') ?? $response->json('id');
    }

    public function name(): string
    {
        return 'zapi';
    }
}
