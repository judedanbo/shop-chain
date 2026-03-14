<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\ProductLocation
 */
class ProductLocationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'warehouse_id' => $this->warehouse_id,
            'branch_id' => $this->branch_id,
            'quantity' => $this->quantity,
            'last_counted_at' => $this->last_counted_at,
            'product' => new ProductResource($this->whenLoaded('product')),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'updated_at' => $this->updated_at,
        ];
    }
}
