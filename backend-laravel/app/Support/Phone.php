<?php

namespace App\Support;

/**
 * Normaliza telefones brasileiros para o formato usado pelas APIs de WhatsApp:
 * apenas dígitos, com DDI 55. Ex.: "(11) 99999-8888" -> "5511999998888".
 */
class Phone
{
    public static function normalize(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        // Remove zero de discagem de longa distância: 011999998888 -> 11999998888
        if (strlen($digits) === 12 && str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        // DDD + número (10 ou 11 dígitos) sem DDI -> adiciona 55
        if (strlen($digits) === 10 || strlen($digits) === 11) {
            $digits = '55' . $digits;
        }

        return $digits;
    }

    public static function isValid(?string $phone): bool
    {
        $normalized = self::normalize($phone);

        return (bool) preg_match('/^55\d{10,11}$/', $normalized);
    }

    /** "5511999998888" -> "(11) 99999-8888" */
    public static function format(?string $phone): string
    {
        $digits = self::normalize($phone);

        if (! preg_match('/^55(\d{2})(\d{4,5})(\d{4})$/', $digits, $m)) {
            return (string) $phone;
        }

        return "({$m[1]}) {$m[2]}-{$m[3]}";
    }
}
