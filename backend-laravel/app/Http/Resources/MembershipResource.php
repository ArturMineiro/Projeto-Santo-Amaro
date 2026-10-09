<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Membership */
class MembershipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'status' => $this->status,
            'unit' => $this->unit,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at?->toIso8601String(),
            'waiting_packages' => $this->whenHas('waiting_packages_count', fn () => (int) $this->waiting_packages_count),
            'user' => new UserResource($this->whenLoaded('user')),
            'association' => $this->when(
                $this->relationLoaded('association'),
                fn () => (new AssociationResource($this->association))
                    ->withInviteCode($this->isAdmin() && $this->isApproved()),
            ),
        ];
    }
}
