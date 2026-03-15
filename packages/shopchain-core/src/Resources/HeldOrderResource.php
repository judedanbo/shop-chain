<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\HeldOrder
 */
class HeldOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'till_id' => $this->till_id,
            'table_number' => $this->table_number,
            'order_type' => $this->order_type,
            'label' => $this->label,
            'held_at' => $this->held_at,
            'till' => $this->whenLoaded('till', fn () => [
                'id' => $this->till->id,
                'name' => $this->till->name,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'notes' => $item->notes,
                'product' => $item->relationLoaded('product') ? [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'price' => $item->product->price,
                    'sku' => $item->product->sku,
                ] : null,
            ])),
            'items_count' => $this->whenCounted('items'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
