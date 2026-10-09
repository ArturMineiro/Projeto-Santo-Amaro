<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Log;

/**
 * Driver de desenvolvimento: só escreve a mensagem no log (storage/logs).
 */
class LogGateway implements WhatsAppGateway
{
    public function send(string $phone, string $message): ?string
    {
        Log::info('[WhatsApp:log] mensagem simulada', ['to' => $phone, 'message' => $message]);

        return null;
    }

    public function name(): string
    {
        return 'log';
    }
}
