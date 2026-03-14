<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Sale
 */
class SaleResource extends JsonResource
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
            'till_id' => $this->till_id,
            'cashier_id' => $this->cashier_id,
            'customer_id' => $this->customer_id,
            'subtotal' => $this->subtotal,
            'tax' => $this->tax,
            'discount' => $this->discount,
            'discount_input' => $this->discount_input,
            'discount_type' => $this->discount_type,
            'total' => $this->total,
            'status' => $this->status,
            'source' => $this->source,
            'verify_token' => $this->verify_token,
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'cashier' => $this->whenLoaded('cashier', fn () => [
                'id' => $this->cashier->id,
                'name' => $this->cashier->name,
            ]),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'items' => SaleItemResource::collection($this->whenLoaded('items')),
            'payments' => SalePaymentResource::collection($this->whenLoaded('payments')),
            'items_count' => $this->whenCounted('items'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
