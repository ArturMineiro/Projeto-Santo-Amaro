<?php

namespace App\Jobs;

use App\Models\Package;
use App\Services\PackageNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Envio em fila para não travar a tela de cadastro enquanto o provedor responde.
 * Com QUEUE_CONNECTION=sync roda na hora, sem precisar de worker.
 */
class SendPackageNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public Package $package)
    {
    }

    public function handle(PackageNotifier $notifier): void
    {
        // Já foi retirada antes do envio? Não faz sentido avisar.
        if ($this->package->fresh()?->isWaiting()) {
            $notifier->notify($this->package);
        }
    }
}
