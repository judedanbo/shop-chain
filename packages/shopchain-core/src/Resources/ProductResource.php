<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Product
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'sku' => $this->sku,
            'name' => $this->name,
            'description' => $this->description,
            'barcode' => $this->barcode,
            'category_id' => $this->category_id,
            'unit_id' => $this->unit_id,
            'price' => $this->price,
            'cost' => $this->cost,
            'reorder_level' => $this->reorder_level,
            'image_url' => $this->image_url,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'batch_tracking' => $this->batch_tracking,
            'skip_kitchen' => $this->skip_kitchen,
            'status' => $this->status,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'unit' => new UnitOfMeasureResource($this->whenLoaded('unit')),
            'batches_count' => $this->whenCounted('batches'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
