<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Batch
 */
class BatchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'shop_id' => $this->shop_id,
            'batch_number' => $this->batch_number,
            'quantity' => $this->quantity,
            'initial_quantity' => $this->initial_quantity,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'received_date' => $this->received_date?->toDateString(),
            'source_po_id' => $this->source_po_id,
            'location' => $this->location,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
