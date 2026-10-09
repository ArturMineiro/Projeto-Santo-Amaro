<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PackageResource;
use App\Jobs\SendPackageNotification;
use App\Models\Membership;
use App\Models\Package;
use App\Models\PackageNotification;
use App\Services\PackageNotifier;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Encomendas — visão da administração. */
class PackageController extends Controller
{
    private const RELATIONS = ['resident', 'membership', 'registeredBy', 'deliveredBy'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in([Package::STATUS_RECEIVED, Package::STATUS_PICKED_UP, 'all'])],
            'search' => ['nullable', 'string', 'max:100'],
            'membership_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'not_notified' => ['nullable', 'boolean'],
        ]);

        $status = $data['status'] ?? Package::STATUS_RECEIVED;

        $query = Package::query()
            ->where('association_id', $this->association($request)->id)
            ->with(self::RELATIONS);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if (! empty($data['membership_id'])) {
            $query->where('membership_id', $data['membership_id']);
        }

        if (! empty($data['not_notified'])) {
            $query->whereNull('notified_at');
        }

        if ($search = trim($data['search'] ?? '')) {
            $query->where(function ($q) use ($search) {
                $q->where('pickup_code', $search)
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('tracking_code', 'like', "%{$search}%")
                    ->orWhereHas('resident', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('membership', fn ($m) => $m->where('unit', 'like', "%{$search}%"));
            });
        }

        // Aguardando: mais antigas primeiro (quem espera há mais tempo aparece no topo)
        $status === Package::STATUS_RECEIVED
            ? $query->oldest('arrived_at')->oldest('id')
            : $query->latest('arrived_at')->latest('id');

        return PackageResource::collection($query->paginate($data['per_page'] ?? 30));
    }

    public function store(Request $request): JsonResponse
    {
        $association = $this->association($request);

        $data = $request->validate([
            'membership_id' => ['required', 'integer'],
            'type' => ['nullable', Rule::in(Package::TYPES)],
            'description' => ['nullable', 'string', 'max:255'],
            'carrier' => ['nullable', 'string', 'max:60'],
            'tracking_code' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'arrived_at' => ['nullable', 'date', 'before_or_equal:now'],
            'notify' => ['nullable', 'boolean'],
        ], [
            'membership_id.required' => 'Escolha o morador.',
        ]);

        $membership = Membership::where('association_id', $association->id)
            ->approved()
            ->find($data['membership_id']);

        if (! $membership) {
            throw ValidationException::withMessages(['membership_id' => 'Morador não encontrado nesta associação.']);
        }

        $package = Package::create([
            'association_id' => $association->id,
            'resident_id' => $membership->user_id,
            'membership_id' => $membership->id,
            'registered_by' => $request->user()->id,
            'type' => $data['type'] ?? 'package',
            'description' => $data['description'] ?? null,
            'carrier' => $data['carrier'] ?? null,
            'tracking_code' => $data['tracking_code'] ?? null,
            'notes' => $data['notes'] ?? null,
            'arrived_at' => $data['arrived_at'] ?? now(),
        ]);

        $notify = $data['notify'] ?? true;
        if ($notify) {
            SendPackageNotification::dispatch($package);
        }

        $package = $package->fresh([...self::RELATIONS, 'notifications']);
                Activity::record('package.created', "Encomenda registrada para {$package->resident->name} ({$package->typeLabel()})", $association, $package, ['carrier' => $package->carrier]);
        $notified = $package->notifications->contains('status', PackageNotification::STATUS_SENT);

        return response()->json([
            'message' => match (true) {
                ! $notify => 'Encomenda registrada.',
                $notified => 'Encomenda registrada e morador avisado.',
                default => 'Encomenda registrada. Avise o morador pelo seu WhatsApp.',
            },
            'package' => new PackageResource($package),
        ], 201);
    }

    public function show(Request $request, Package $package): PackageResource
    {
        $this->authorizePackage($request, $package);

        return new PackageResource($package->load([...self::RELATIONS, 'notifications']));
    }

    public function update(Request $request, Package $package): JsonResponse
    {
        $this->authorizePackage($request, $package);

        $data = $request->validate([
            'type' => ['sometimes', Rule::in(Package::TYPES)],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'carrier' => ['sometimes', 'nullable', 'string', 'max:60'],
            'tracking_code' => ['sometimes', 'nullable', 'string', 'max:80'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $package->update($data);

        return response()->json([
            'message' => 'Encomenda atualizada.',
            'package' => new PackageResource($package->fresh([...self::RELATIONS, 'notifications'])),
        ]);
    }

    /** Marca como retirada. O código é opcional, mas se vier precisa bater. */
    public function pickup(Request $request, Package $package): JsonResponse
    {
        $this->authorizePackage($request, $package);

        $data = $request->validate([
            'pickup_code' => ['nullable', 'string', 'max:6'],
            'picked_up_by_name' => ['nullable', 'string', 'max:120'],
        ]);

        if (! $package->isWaiting()) {
            throw ValidationException::withMessages(['package' => 'Esta encomenda já foi retirada.']);
        }

        if (! empty($data['pickup_code']) && $data['pickup_code'] !== $package->pickup_code) {
            throw ValidationException::withMessages(['pickup_code' => 'Código não confere. Peça para o morador conferir.']);
        }

        $package->update([
            'status' => Package::STATUS_PICKED_UP,
            'picked_up_at' => now(),
            'picked_up_by_name' => $data['picked_up_by_name'] ?? null,
            'delivered_by' => $request->user()->id,
        ]);

        $this->log($request, 'package.picked_up', 'Encomenda entregue', $package);

        return response()->json([
            'message' => 'Entrega confirmada.',
            'package' => new PackageResource($package->fresh(self::RELATIONS)),
        ]);
    }

    /** Desfaz uma retirada marcada por engano. */
    public function undoPickup(Request $request, Package $package): JsonResponse
    {
        $this->authorizePackage($request, $package);

        $package->update([
            'status' => Package::STATUS_RECEIVED,
            'picked_up_at' => null,
            'picked_up_by_name' => null,
            'delivered_by' => null,
        ]);

        $this->log($request, 'package.pickup_undone', 'Entrega desfeita', $package);

        return response()->json([
            'message' => 'Encomenda voltou para "aguardando retirada".',
            'package' => new PackageResource($package->fresh(self::RELATIONS)),
        ]);
    }

    /** Reenvia o aviso (ex.: morador diz que não recebeu). */
    public function notify(Request $request, Package $package): JsonResponse
    {
        $this->authorizePackage($request, $package);

        if (! $package->isWaiting()) {
            throw ValidationException::withMessages(['package' => 'Esta encomenda já foi retirada.']);
        }

        SendPackageNotification::dispatch($package);
        $this->log($request, 'package.notify_resent', 'Aviso reenviado', $package);

        return response()->json([
            'message' => 'Aviso reenviado.',
            'package' => new PackageResource($package->fresh([...self::RELATIONS, 'notifications'])),
        ]);
    }

    /** A administração avisou pelo próprio WhatsApp (botão "Avisar pelo meu WhatsApp"). */
    public function notifiedManually(Request $request, Package $package, PackageNotifier $notifier): JsonResponse
    {
        $this->authorizePackage($request, $package);

        if (! $package->isWaiting()) {
            throw ValidationException::withMessages(['package' => 'Esta encomenda já foi retirada.']);
        }

        $notifier->markManualWhatsApp($package);
        $this->log($request, 'package.notified_manually', 'Aviso pelo WhatsApp da administração', $package);

        return response()->json([
            'message' => 'Aviso pelo WhatsApp registrado.',
            'package' => new PackageResource($package->fresh([...self::RELATIONS, 'notifications'])),
        ]);
    }

    public function destroy(Request $request, Package $package): JsonResponse
    {
        $this->authorizePackage($request, $package);
        $this->log($request, 'package.deleted', "Registro apagado (código {$package->pickup_code})", $package);
        $package->delete();

        return response()->json(['message' => 'Registro apagado.']);
    }

    private function log(Request $request, string $action, string $text, Package $package): void
    {
        $package->loadMissing('resident');
        Activity::record($action, "{$text}: {$package->resident?->name}", $this->association($request), $package);
    }

    private function authorizePackage(Request $request, Package $package): void
    {
        abort_unless((int) $package->association_id === (int) $this->association($request)->id, 404);
    }
}
