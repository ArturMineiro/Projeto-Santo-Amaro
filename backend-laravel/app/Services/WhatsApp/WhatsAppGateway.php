<?php

namespace App\Services\WhatsApp;

interface WhatsAppGateway
{
    /**
     * Envia uma mensagem de texto.
     *
     * @param  string  $phone  Somente dígitos, com DDI (ex.: 5511999998888)
     * @return string|null      ID da mensagem no provedor, se houver
     *
     * @throws WhatsAppException quando o provedor recusar ou estiver fora do ar
     */
    public function send(string $phone, string $message): ?string;

    /** Nome curto do provedor, gravado no histórico de notificações. */
    public function name(): string;
}
