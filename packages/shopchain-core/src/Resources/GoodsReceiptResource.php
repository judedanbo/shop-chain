<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\GoodsReceipt
 */
class GoodsReceiptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'reference' => $this->reference,
            'warehouse_id' => $this->warehouse_id,
            'receipt_date' => $this->receipt_date?->toDateString(),
            'notes' => $this->notes,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'items' => GoodsReceiptItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenCounted('items'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
