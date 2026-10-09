<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Twilio WhatsApp — https://www.twilio.com/docs/whatsapp
 * Obs.: fora da janela de 24h a Twilio exige template aprovado.
 */
class TwilioGateway implements WhatsAppGateway
{
    public function __construct(
        private readonly string $sid,
        private readonly string $token,
        private readonly string $from,
    ) {
    }

    public function send(string $phone, string $message): ?string
    {
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$this->sid}/Messages.json";
        $from = str_starts_with($this->from, 'whatsapp:') ? $this->from : 'whatsapp:' . $this->from;

        try {
            $response = Http::timeout(15)
                ->withBasicAuth($this->sid, $this->token)
                ->asForm()
                ->post($url, [
                    'From' => $from,
                    'To' => 'whatsapp:+' . $phone,
                    'Body' => $message,
                ]);
        } catch (ConnectionException $e) {
            throw new WhatsAppException('Twilio indisponível: ' . $e->getMessage(), previous: $e);
        }

        if ($response->failed()) {
            throw new WhatsAppException("Twilio respondeu {$response->status()}: " . $response->body());
        }

        return $response->json('sid');
    }

    public function name(): string
    {
        return 'twilio';
    }
}
