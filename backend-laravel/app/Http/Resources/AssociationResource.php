<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Association */
class AssociationResource extends JsonResource
{
    private bool $withInviteCode = false;

    /** O código de convite só é exposto para a administração. */
    public function withInviteCode(bool $show = true): static
    {
        $this->withInviteCode = $show;

        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'pickup_hours' => $this->pickup_hours,
            'invite_code' => $this->when($this->withInviteCode, $this->invite_code),
        ];
    }
}
