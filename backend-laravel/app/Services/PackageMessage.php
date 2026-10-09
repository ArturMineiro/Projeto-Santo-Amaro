<?php

namespace App\Services;

use App\Models\Package;
use App\Support\Phone;

/**
 * Monta os textos enviados ao morador. Fica num lugar só para que
 * WhatsApp, email e o link "wa.me" usem exatamente a mesma mensagem.
 */
class PackageMessage
{
    public static function arrived(Package $package): string
    {
        $package->loadMissing(['resident', 'association']);

        $name = $package->resident->firstName();
        $association = $package->association->name;
        $what = self::subject($package);

        $lines = [
            "Olá, {$name}! {$what} chegou na {$association}. Pode retirar quando quiser 😊",
            '',
            "Código de retirada: *{$package->pickup_code}*",
        ];

        if ($package->description) {
            $lines[] = "Descrição: {$package->description}";
        }

        if ($package->association->pickup_hours) {
            $lines[] = "Horário: {$package->association->pickup_hours}";
        }

        return implode("\n", $lines);
    }

    /** "Sua encomenda", "Sua carta", "Seu documento"... */
    public static function subject(Package $package): string
    {
        return match ($package->type) {
            'letter' => 'Sua carta',
            'document' => 'Seu documento',
            'package' => 'Seu pacote',
            default => 'Sua encomenda',
        };
    }

    /**
     * Link gratuito "clique para conversar". Abre o WhatsApp de quem clicou
     * já com a mensagem pronta — útil enquanto não há API paga configurada.
     */
    public static function whatsappLink(Package $package): string
    {
        $package->loadMissing('resident');

        return 'https://wa.me/' . Phone::normalize($package->resident->phone)
            . '?text=' . rawurlencode(self::arrived($package));
    }
}
