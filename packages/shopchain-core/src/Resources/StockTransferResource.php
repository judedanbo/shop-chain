<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\StockTransfer
 */
class StockTransferResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'product_id' => $this->product_id,
            'from_warehouse_id' => $this->from_warehouse_id,
            'to_warehouse_id' => $this->to_warehouse_id,
            'from_branch_id' => $this->from_branch_id,
            'to_branch_id' => $this->to_branch_id,
            'quantity' => $this->quantity,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'approved_by' => $this->approved_by,
            'notes' => $this->notes,
            'shipped_at' => $this->shipped_at,
            'received_at' => $this->received_at,
            'product' => new ProductResource($this->whenLoaded('product')),
            'fromWarehouse' => new WarehouseResource($this->whenLoaded('fromWarehouse')),
            'toWarehouse' => new WarehouseResource($this->whenLoaded('toWarehouse')),
            'fromBranch' => new BranchResource($this->whenLoaded('fromBranch')),
            'toBranch' => new BranchResource($this->whenLoaded('toBranch')),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
