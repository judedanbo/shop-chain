<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\SalePayment
 */
class SalePaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_id' => $this->sale_id,
            'method' => $this->method,
            'label' => $this->label,
            'amount' => $this->amount,
            'amount_tendered' => $this->amount_tendered,
            'change_given' => $this->change_given,
            'card_type' => $this->card_type,
            'card_trans_no' => $this->card_trans_no,
            'momo_provider' => $this->momo_provider,
            'momo_phone' => $this->momo_phone,
            'momo_ref' => $this->momo_ref,
            'created_at' => $this->created_at,
        ];
    }
}
