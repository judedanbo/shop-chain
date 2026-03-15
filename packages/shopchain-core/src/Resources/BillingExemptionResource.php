<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\BillingExemption
 */
class BillingExemptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'period' => $this->period,
            'unit' => $this->unit,
            'unlimited' => $this->unlimited,
            'reason' => $this->reason,
            'starts_at' => $this->starts_at,
            'expires_at' => $this->expires_at,
            'granted_by' => $this->whenLoaded('grantedBy', fn () => [
                'id' => $this->grantedBy->id,
                'name' => $this->grantedBy->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
