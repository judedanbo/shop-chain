<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\POItem
 */
class POItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'po_id' => $this->po_id,
            'product_id' => $this->product_id,
            'quantity_ordered' => $this->quantity_ordered,
            'quantity_received' => $this->quantity_received,
            'unit_cost' => $this->unit_cost,
            'unit_id' => $this->unit_id,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'product' => new ProductResource($this->whenLoaded('product')),
            'unit' => new UnitOfMeasureResource($this->whenLoaded('unit')),
        ];
    }
}
