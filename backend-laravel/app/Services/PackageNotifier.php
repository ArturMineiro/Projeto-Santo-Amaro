<?php

namespace App\Services;

use App\Mail\PackageArrivedMail;
use App\Models\Package;
use App\Models\PackageNotification;
use App\Services\WhatsApp\WhatsAppGateway;
use App\Support\Phone;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Avisa o morador que a encomenda chegou.
 *
 * Regras:
 *  - WhatsApp é tentado se o morador aceita e há provedor configurado.
 *  - Email é enviado se o morador aceita e tem email.
 *  - Se o WhatsApp falhar (ou estiver desligado), o email vira fallback
 *    mesmo que o morador tenha desmarcado email — melhor avisar do que não avisar.
 *  - Toda tentativa fica registrada em package_notifications.
 */
class PackageNotifier
{
    public function __construct(private readonly ?WhatsAppGateway $whatsapp)
    {
    }

    /** @return PackageNotification[] */
    public function notify(Package $package): array
    {
        $package->loadMissing(['resident', 'association']);
        $resident = $package->resident;
        $attempts = [];
        $whatsappSent = false;

        if ($this->whatsapp && $resident->notify_whatsapp && Phone::isValid($resident->phone)) {
            $attempts[] = $attempt = $this->sendWhatsApp($package);
            $whatsappSent = $attempt->status === PackageNotification::STATUS_SENT;
        }

        $wantsEmail = $resident->notify_email || ! $whatsappSent;

        if ($resident->email && $wantsEmail) {
            $attempts[] = $this->sendEmail($package);
        }

        if (collect($attempts)->contains('status', PackageNotification::STATUS_SENT)) {
            $package->forceFill(['notified_at' => now()])->save();
        }

        return $attempts;
    }

    public function whatsappEnabled(): bool
    {
        return $this->whatsapp !== null;
    }

    /**
     * Registra que a administração avisou pelo próprio WhatsApp (botão wa.me).
     * Não dá para confirmar a entrega, então vale o que a administração informou.
     */
    public function markManualWhatsApp(Package $package): PackageNotification
    {
        $package->loadMissing('resident');

        $notification = $this->record(
            $package,
            PackageNotification::CHANNEL_WHATSAPP,
            Phone::normalize($package->resident->phone),
            PackageNotification::PROVIDER_MANUAL,
        );

        $package->forceFill(['notified_at' => now()])->save();

        return $notification;
    }

    private function sendWhatsApp(Package $package): PackageNotification
    {
        $phone = Phone::normalize($package->resident->phone);

        try {
            $messageId = $this->whatsapp->send($phone, PackageMessage::arrived($package));

            return $this->record($package, PackageNotification::CHANNEL_WHATSAPP, $phone, $this->whatsapp->name(), $messageId);
        } catch (Throwable $e) {
            Log::warning('Falha ao enviar WhatsApp', ['package' => $package->id, 'error' => $e->getMessage()]);

            return $this->record($package, PackageNotification::CHANNEL_WHATSAPP, $phone, $this->whatsapp->name(), error: $e->getMessage());
        }
    }

    private function sendEmail(Package $package): PackageNotification
    {
        $email = $package->resident->email;

        try {
            Mail::to($email)->send(new PackageArrivedMail($package));

            return $this->record($package, PackageNotification::CHANNEL_EMAIL, $email, config('mail.default'));
        } catch (Throwable $e) {
            Log::warning('Falha ao enviar email', ['package' => $package->id, 'error' => $e->getMessage()]);

            return $this->record($package, PackageNotification::CHANNEL_EMAIL, $email, config('mail.default'), error: $e->getMessage());
        }
    }

    private function record(
        Package $package,
        string $channel,
        string $recipient,
        ?string $provider,
        ?string $messageId = null,
        ?string $error = null,
    ): PackageNotification {
        return $package->notifications()->create([
            'channel' => $channel,
            'status' => $error ? PackageNotification::STATUS_FAILED : PackageNotification::STATUS_SENT,
            'recipient' => $recipient,
            'provider' => $provider,
            'provider_message_id' => $messageId,
            'error' => $error ? mb_substr($error, 0, 1000) : null,
        ]);
    }
}
