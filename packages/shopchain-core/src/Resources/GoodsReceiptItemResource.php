<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\GoodsReceiptItem
 */
class GoodsReceiptItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_id' => $this->receipt_id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'batch_number' => $this->batch_number,
            'condition' => $this->condition,
            'notes' => $this->notes,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }
}
