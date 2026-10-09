<?php

namespace App\Providers;

use App\Services\PackageNotifier;
use App\Services\WhatsApp\LogGateway;
use App\Services\WhatsApp\TwilioGateway;
use App\Services\WhatsApp\UltraMsgGateway;
use App\Services\WhatsApp\WhatsAppGateway;
use App\Services\WhatsApp\ZApiGateway;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PackageNotifier::class, function ($app) {
            return new PackageNotifier($this->makeWhatsAppGateway());
        });
    }

    public function boot(): void
    {
        // Respostas da API sem o envelope {"data": ...} em recursos únicos
        JsonResource::withoutWrapping();
    }

    private function makeWhatsAppGateway(): ?WhatsAppGateway
    {
        $config = config('services.whatsapp');

        return match ($config['driver'] ?? 'none') {
            'none', '', null => null,
            'log' => new LogGateway(),
            'zapi' => new ZApiGateway(
                $config['zapi']['instance'] ?? '',
                $config['zapi']['token'] ?? '',
                $config['zapi']['client_token'] ?? null,
            ),
            'ultramsg' => new UltraMsgGateway(
                $config['ultramsg']['instance'] ?? '',
                $config['ultramsg']['token'] ?? '',
            ),
            'twilio' => new TwilioGateway(
                $config['twilio']['sid'] ?? '',
                $config['twilio']['token'] ?? '',
                $config['twilio']['from'] ?? '',
            ),
            default => throw new InvalidArgumentException("WHATSAPP_DRIVER inválido: {$config['driver']}"),
        };
    }
}
