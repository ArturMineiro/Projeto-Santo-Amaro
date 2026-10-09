<?php

namespace App\Http\Resources;

use App\Support\Phone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'first_name' => $this->firstName(),
            'phone' => $this->phone,
            'phone_formatted' => Phone::format($this->phone),
            'email' => $this->email,
            'notify_whatsapp' => $this->notify_whatsapp,
            'notify_email' => $this->notify_email,
            'has_access' => $this->hasPassword(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
