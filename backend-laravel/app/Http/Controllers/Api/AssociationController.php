<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AssociationResource;
use App\Models\Association;
use App\Models\Membership;
use App\Models\Package;
use App\Models\PackageNotification;
use App\Services\PackageNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssociationController extends Controller
{
    /** Números do painel da administração. */
    public function dashboard(Request $request, PackageNotifier $notifier): JsonResponse
    {
        $association = $this->association($request);
        $todayStart = now(config('app.local_timezone'))->startOfDay()->utc();

        $packages = Package::where('association_id', $association->id);

        return response()->json([
            'waiting' => (clone $packages)->waiting()->count(),
            'waiting_over_7_days' => (clone $packages)->waiting()->where('arrived_at', '<', now()->subDays(7))->count(),
            // Esperando e ninguém avisou o morador ainda (nem automático nem pelo WhatsApp manual)
            'waiting_not_notified' => (clone $packages)->waiting()->whereNull('notified_at')->count(),
            'received_today' => (clone $packages)->where('arrived_at', '>=', $todayStart)->count(),
            'picked_up_today' => (clone $packages)->where('picked_up_at', '>=', $todayStart)->count(),
            'residents' => Membership::where('association_id', $association->id)->approved()->count(),
            'pending_residents' => Membership::where('association_id', $association->id)
                ->where('status', Membership::STATUS_PENDING)->count(),
            'failed_notifications_7d' => PackageNotification::whereHas('package', fn ($q) => $q->where('association_id', $association->id))
                ->where('status', PackageNotification::STATUS_FAILED)
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
            'whatsapp_enabled' => $notifier->whatsappEnabled(),
        ]);
    }

    public function show(Request $request): AssociationResource
    {
        return $this->resource($request, $this->association($request));
    }

    public function update(Request $request): JsonResponse
    {
        $association = $this->association($request);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pickup_hours' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        $association->update($data);

        return response()->json([
            'message' => 'Dados da associação salvos.',
            'association' => $this->resource($request, $association),
        ]);
    }

    /** Gera um código novo (ex.: o antigo vazou num grupo público). */
    public function regenerateInviteCode(Request $request): JsonResponse
    {
        $association = $this->association($request);
        $association->update(['invite_code' => Association::generateInviteCode()]);

        return response()->json([
            'message' => 'Novo código gerado. O anterior deixou de funcionar.',
            'association' => $this->resource($request, $association),
        ]);
    }

    private function resource(Request $request, Association $association): AssociationResource
    {
        return (new AssociationResource($association))
            ->withInviteCode($this->membership($request)->isAdmin());
    }
}
