<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Customer
 */
class CustomerResource extends JsonResource
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
            'phone' => $this->phone,
            'email' => $this->email,
            'type' => $this->type,
            'total_spent' => $this->total_spent,
            'visits' => $this->visits,
            'last_visit' => $this->last_visit,
            'loyalty_pts' => $this->loyalty_pts,
            'notes' => $this->notes,
            'sales_count' => $this->whenCounted('sales'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
