<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\KitchenOrder
 */
class KitchenOrderResource extends JsonResource
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
            'sale_id' => $this->sale_id,
            'table_number' => $this->table_number,
            'order_type' => $this->order_type,
            'status' => $this->status,
            'total' => $this->total,
            'bar_fulfilled' => $this->bar_fulfilled,
            'accepted_at' => $this->accepted_at,
            'completed_at' => $this->completed_at,
            'rejected_at' => $this->rejected_at,
            'rejection_reason' => $this->rejection_reason,
            'served_at' => $this->served_at,
            'returned_at' => $this->returned_at,
            'return_reason' => $this->return_reason,
            'cancelled_at' => $this->cancelled_at,
            'server' => $this->whenLoaded('server', fn () => [
                'id' => $this->server->id,
                'name' => $this->server->name,
            ]),
            'cancelled_by' => $this->whenLoaded('cancelledByUser', fn () => [
                'id' => $this->cancelledByUser->id,
                'name' => $this->cancelledByUser->name,
            ]),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'till' => new TillResource($this->whenLoaded('till')),
            'items' => KitchenOrderItemResource::collection($this->whenLoaded('items')),
            'till_payments' => TillPaymentResource::collection($this->whenLoaded('tillPayments')),
            'items_count' => $this->whenCounted('items'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
