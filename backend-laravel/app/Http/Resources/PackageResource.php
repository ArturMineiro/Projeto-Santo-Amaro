<?php

namespace App\Http\Resources;

use App\Services\PackageMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Package */
class PackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = (bool) $request->attributes->get('membership')?->isAdmin();

        return [
            'id' => $this->id,
            'type' => $this->type,
            'type_label' => $this->typeLabel(),
            'description' => $this->description,
            'carrier' => $this->carrier,
            'tracking_code' => $this->tracking_code,
            'notes' => $this->notes,
            'status' => $this->status,
            'pickup_code' => $this->pickup_code,
            'arrived_at' => $this->arrived_at?->toIso8601String(),
            'notified_at' => $this->notified_at?->toIso8601String(),
            'picked_up_at' => $this->picked_up_at?->toIso8601String(),
            'picked_up_by_name' => $this->picked_up_by_name,
            'unit' => $this->whenLoaded('membership', fn () => $this->membership?->unit),
            'resident' => new UserResource($this->whenLoaded('resident')),
            'registered_by' => $this->whenLoaded('registeredBy', fn () => $this->registeredBy?->name),
            'delivered_by' => $this->whenLoaded('deliveredBy', fn () => $this->deliveredBy?->name),
            'notifications' => $this->when(
                $isAdmin && $this->relationLoaded('notifications'),
                fn () => $this->notifications->map(fn ($n) => [
                    'channel' => $n->channel,
                    'status' => $n->status,
                    'recipient' => $n->recipient,
                    'error' => $n->error,
                    'created_at' => $n->created_at?->toIso8601String(),
                ]),
            ),
            // Link wa.me pronto para a administração avisar manualmente
            'whatsapp_link' => $this->when(
                $isAdmin && $this->isWaiting() && $this->relationLoaded('resident'),
                fn () => PackageMessage::whatsappLink($this->resource),
            ),
        ];
    }
}
