<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Product
 */
class SupplierProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'unit_cost' => $this->pivot->unit_cost,
            'lead_time_days' => $this->pivot->lead_time_days,
            'is_preferred' => $this->pivot->is_preferred,
        ];
    }
}
