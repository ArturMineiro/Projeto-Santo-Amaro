<?php

namespace App\Services;

/**
 * Lê o final do storage/logs/laravel.log e separa em entradas.
 * Lê só os últimos ~512 KB para não pesar mesmo com log grande.
 */
class AppLogReader
{
    private const MAX_BYTES = 512 * 1024;

    public function __construct(private readonly ?string $path = null)
    {
    }

    public function path(): string
    {
        return $this->path ?? storage_path('logs/laravel.log');
    }

    public function size(): int
    {
        return is_file($this->path()) ? (int) filesize($this->path()) : 0;
    }

    /**
     * @return array<int, array{time: string, level: string, message: string, details: string|null}>
     */
    public function entries(int $limit = 100, ?string $level = null, ?string $search = null): array
    {
        $content = $this->tail();
        if ($content === '') {
            return [];
        }

        // Cada entrada começa com "[2026-10-09 12:00:00] local.ERROR: ..."
        $parts = preg_split('/^(?=\[\d{4}-\d{2}-\d{2}[ T][^\]]*\] \w+\.\w+:)/m', $content) ?: [];
        $entries = [];

        foreach (array_reverse($parts) as $raw) {
            if (! preg_match('/^\[([^\]]+)\] \w+\.(\w+): (.*)$/s', trim($raw), $m)) {
                continue;
            }

            $entryLevel = strtolower($m[2]);
            if ($level && $entryLevel !== strtolower($level)) {
                continue;
            }
            if ($search && mb_stripos($m[3], $search) === false) {
                continue;
            }

            [$message, $details] = array_pad(explode("\n", $m[3], 2), 2, null);
            $entries[] = [
                'time' => $m[1],
                'level' => $entryLevel,
                'message' => mb_substr($message, 0, 2000),
                'details' => $details ? mb_substr(trim($details), 0, 4000) : null,
            ];

            if (count($entries) >= $limit) {
                break;
            }
        }

        return $entries;
    }

    private function tail(): string
    {
        $path = $this->path();
        if (! is_file($path) || ! is_readable($path)) {
            return '';
        }

        $size = filesize($path);
        $handle = fopen($path, 'rb');
        if ($size > self::MAX_BYTES) {
            fseek($handle, -self::MAX_BYTES, SEEK_END);
        }
        $content = stream_get_contents($handle) ?: '';
        fclose($handle);

        // Descarta a primeira linha que pode ter sido cortada no meio
        if ($size > self::MAX_BYTES && ($pos = strpos($content, "\n")) !== false) {
            $content = substr($content, $pos + 1);
        }

        // Garante UTF-8 válido para o JSON
        return mb_convert_encoding($content, 'UTF-8', 'UTF-8');
    }
}
