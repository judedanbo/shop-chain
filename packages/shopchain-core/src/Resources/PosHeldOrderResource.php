<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\PosHeldOrder
 */
class PosHeldOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'branch_id' => $this->branch_id,
            'held_by' => $this->held_by,
            'discount_value' => $this->discount_value,
            'discount_type' => $this->discount_type,
            'held_at' => $this->held_at,
            'held_by_user' => $this->whenLoaded('heldBy', fn () => [
                'id' => $this->heldBy->id,
                'name' => $this->heldBy->name,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'product' => $item->relationLoaded('product') ? [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'price' => $item->product->price,
                ] : null,
            ])),
            'items_count' => $this->whenCounted('items'),
        ];
    }
}
