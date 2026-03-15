<?php

namespace ShopChain\Core\Services;

use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\KitchenOrderStatus;
use ShopChain\Core\Enums\TillPayMethod;
use ShopChain\Core\Models\KitchenOrder;
use ShopChain\Core\Models\Till;
use ShopChain\Core\Models\TillPayment;

class TillPaymentService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function recordPayment(Till $till, KitchenOrder $order, array $data): TillPayment
    {
        if (! $till->is_active) {
            throw ValidationException::withMessages([
                'till' => ['Cannot record payment on a closed till.'],
            ]);
        }

        if ($order->till_id !== $till->id) {
            throw ValidationException::withMessages([
                'order_id' => ['This order does not belong to this till.'],
            ]);
        }

        if (! in_array($order->status, [KitchenOrderStatus::Completed, KitchenOrderStatus::Served])) {
            throw ValidationException::withMessages([
                'order_id' => ['Only completed or served orders can be paid.'],
            ]);
        }

        $method = TillPayMethod::from($data['method']);
        $amount = (float) $data['amount'];

        $paymentData = [
            'till_id' => $till->id,
            'order_id' => $order->id,
            'amount' => $amount,
            'method' => $method,
            'paid_at' => now(),
        ];

        if ($method === TillPayMethod::Cash) {
            $amountTendered = (float) ($data['amount_tendered'] ?? $amount);
            $paymentData['amount_tendered'] = $amountTendered;
            $paymentData['change_given'] = round(max(0, $amountTendered - $amount), 2);
        }

        if ($method === TillPayMethod::Card) {
            $paymentData['card_type'] = $data['card_type'] ?? null;
            $paymentData['card_trans_no'] = $data['card_trans_no'] ?? null;
        }

        if ($method === TillPayMethod::Momo) {
            $paymentData['momo_provider'] = $data['momo_provider'] ?? null;
            $paymentData['momo_phone'] = $data['momo_phone'] ?? null;
            $paymentData['momo_trans_id'] = $data['momo_trans_id'] ?? null;
        }

        return TillPayment::create($paymentData);
    }
}
