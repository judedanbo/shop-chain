<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\PriceHistory
 */
class PriceHistoryResource extends JsonResource
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
            'old_price' => $this->old_price,
            'new_price' => $this->new_price,
            'old_cost' => $this->old_cost,
            'new_cost' => $this->new_cost,
            'reason' => $this->reason,
            'changed_by' => $this->changed_by,
            'created_at' => $this->created_at,
        ];
    }
}
