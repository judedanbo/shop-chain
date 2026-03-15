<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\PaymentMethod
 */
class PaymentMethodResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'provider' => $this->provider,
            'last4' => $this->last4,
            'display_name' => $this->display_name,
            'is_default' => $this->is_default,
            'expiry' => $this->expiry,
            'status' => $this->status,
            'added_at' => $this->added_at,
        ];
    }
}
