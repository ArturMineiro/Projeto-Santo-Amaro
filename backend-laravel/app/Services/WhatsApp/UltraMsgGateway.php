<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * UltraMsg — https://docs.ultramsg.com/
 * POST https://api.ultramsg.com/{instance}/messages/chat
 */
class UltraMsgGateway implements WhatsAppGateway
{
    public function __construct(
        private readonly string $instance,
        private readonly string $token,
    ) {
    }

    public function send(string $phone, string $message): ?string
    {
        $url = "https://api.ultramsg.com/{$this->instance}/messages/chat";

        try {
            $response = Http::timeout(15)->asForm()->post($url, [
                'token' => $this->token,
                'to' => '+' . $phone,
                'body' => $message,
            ]);
        } catch (ConnectionException $e) {
            throw new WhatsAppException('UltraMsg indisponível: ' . $e->getMessage(), previous: $e);
        }

        // UltraMsg pode responder 200 com {"error": ...}
        if ($response->failed() || $response->json('error')) {
            throw new WhatsAppException("UltraMsg respondeu {$response->status()}: " . $response->body());
        }

        $id = $response->json('id');

        return $id !== null ? (string) $id : null;
    }

    public function name(): string
    {
        return 'ultramsg';
    }
}
