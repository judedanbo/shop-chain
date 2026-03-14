<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Shop
 */
class ShopSettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'currency' => $this->currency,
            'timezone' => $this->timezone,
            'tax_rate' => $this->tax_rate,
            'tax_label' => $this->tax_label,
            'receipt_footer' => $this->receipt_footer,
            'low_stock_threshold' => $this->low_stock_threshold,
        ];
    }
}
