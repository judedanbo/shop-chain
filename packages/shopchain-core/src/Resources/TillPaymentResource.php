<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\TillPayment
 */
class TillPaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'till_id' => $this->till_id,
            'order_id' => $this->order_id,
            'amount' => $this->amount,
            'method' => $this->method,
            'paid_at' => $this->paid_at,
            'amount_tendered' => $this->amount_tendered,
            'change_given' => $this->change_given,
            'card_type' => $this->card_type,
            'card_trans_no' => $this->card_trans_no,
            'momo_provider' => $this->momo_provider,
            'momo_phone' => $this->momo_phone,
            'momo_trans_id' => $this->momo_trans_id,
            'order' => new KitchenOrderResource($this->whenLoaded('order')),
        ];
    }
}
