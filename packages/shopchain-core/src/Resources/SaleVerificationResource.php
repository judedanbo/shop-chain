<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use ShopChain\Core\Enums\PayMethod;

/**
 * @mixin \ShopChain\Core\Models\Sale
 */
class SaleVerificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'status' => $this->status,
            'shop_name' => $this->shop->name,
            'branch_name' => $this->branch->name,
            'branch_address' => $this->branch->address,
            'receipt_date' => $this->created_at,
            'cashier_name' => $this->cashier->name,
            'customer_name' => static::maskCustomerName($this->customer?->name),
            'payment_method' => $this->derivePaymentMethodLabel(),
            'items' => $this->items->map(fn ($item) => [
                'name' => $item->product->name,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'line_total' => $item->line_total,
            ]),
            'summary' => [
                'subtotal' => $this->subtotal,
                'discount' => $this->discount > 0 ? $this->discount : null,
                'discount_type' => $this->discount > 0 ? $this->discount_type : null,
                'tax' => $this->tax,
                'total' => $this->total,
            ],
            'reversal_reason' => $this->reversal_reason,
            'reversed_at' => $this->reversed_at,
            'reversal_requested_at' => $this->reversal_requested_at,
        ];
    }

    public static function maskCustomerName(?string $name): ?string
    {
        if ($name === null) {
            return null;
        }

        $parts = explode(' ', $name, 2);

        if (count($parts) === 1) {
            return $name;
        }

        return $parts[0].' '.mb_substr($parts[1], 0, 1).'.';
    }

    private function derivePaymentMethodLabel(): string
    {
        if ($this->payments->count() > 1) {
            return 'Split Payment';
        }

        return match ($this->payments->first()->method) {
            PayMethod::Cash => 'Cash',
            PayMethod::Card => 'Card',
            PayMethod::Momo => 'Mobile Money',
            default => 'Unknown',
        };
    }
}
