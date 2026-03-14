<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Warehouse
 */
class WarehouseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'name' => $this->name,
            'type' => $this->type,
            'manager_id' => $this->manager_id,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'capacity' => $this->capacity,
            'zones' => $this->zones,
            'status' => $this->status,
            'product_locations_count' => $this->whenCounted('productLocations'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
