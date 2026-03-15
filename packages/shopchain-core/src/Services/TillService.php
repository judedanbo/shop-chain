<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\DiscountType;
use ShopChain\Core\Enums\KitchenOrderStatus;
use ShopChain\Core\Enums\PayMethod;
use ShopChain\Core\Enums\SaleSource;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Till;
use ShopChain\Core\Models\TillPayment;

class TillService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function openTill(Shop $shop, array $data, User $user): Till
    {
        $till = Till::create([
            'shop_id' => $shop->id,
            'branch_id' => $data['branch_id'],
            'name' => $data['name'],
            'opened_by' => $user->id,
            'opened_at' => now(),
            'is_active' => true,
            'opening_float' => $data['opening_float'] ?? 0,
        ]);

        return $till->load(['branch', 'openedBy'])->loadCount('sales');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function closeTill(Till $till, array $data, User $user): Till
    {
        if (! $till->is_active) {
            throw ValidationException::withMessages([
                'till' => ['This till is already closed.'],
            ]);
        }

        // Check for unresolved kitchen orders
        $unresolvedCount = $till->kitchenOrders()
            ->whereIn('status', [KitchenOrderStatus::Pending, KitchenOrderStatus::Accepted])
            ->count();

        if ($unresolvedCount > 0) {
            throw ValidationException::withMessages([
                'till' => ['Cannot close till with unresolved orders. Please resolve or cancel all pending/accepted orders first.'],
            ]);
        }

        return DB::transaction(function () use ($till, $data, $user) {
            $till->update([
                'is_active' => false,
                'closed_at' => now(),
                'closed_by' => $user->id,
                'closing_balance' => $data['closing_balance'],
            ]);

            $this->aggregateBarSale($till, $user);

            return $till->load(['branch', 'openedBy', 'closedBy'])->loadCount('sales');
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function getTillSummary(Till $till): array
    {
        // Retail POS sales
        $sales = $till->sales()
            ->where('status', SaleStatus::Completed)
            ->where('source', SaleSource::Pos)
            ->with('payments')
            ->get();

        $salesCount = $sales->count();
        $totalSales = $sales->sum('total');

        $cashTendered = 0;
        $changeGiven = 0;
        $cashReceived = 0;
        $cardReceived = 0;
        $momoReceived = 0;

        foreach ($sales as $sale) {
            foreach ($sale->payments as $payment) {
                $method = $payment->method->value;

                if ($method === 'cash') {
                    $cashTendered += (float) $payment->amount_tendered;
                    $changeGiven += (float) $payment->change_given;
                    $cashReceived += (float) $payment->amount;
                } elseif ($method === 'card') {
                    $cardReceived += (float) $payment->amount;
                } elseif ($method === 'momo') {
                    $momoReceived += (float) $payment->amount;
                }
            }
        }

        // Bar till payments
        $tillPayments = $till->payments()->get();
        $kitchenOrdersCount = $till->kitchenOrders()
            ->whereNotIn('status', [KitchenOrderStatus::Rejected, KitchenOrderStatus::Cancelled])
            ->count();
        $tillPaymentsTotal = 0;

        foreach ($tillPayments as $payment) {
            $method = $payment->method->value;
            $tillPaymentsTotal += (float) $payment->amount;

            if ($method === 'cash') {
                $cashTendered += (float) $payment->amount_tendered;
                $changeGiven += (float) $payment->change_given;
                $cashReceived += (float) $payment->amount;
            } elseif ($method === 'card') {
                $cardReceived += (float) $payment->amount;
            } elseif ($method === 'momo') {
                $momoReceived += (float) $payment->amount;
            }
        }

        $openingFloat = (float) $till->opening_float;
        $expectedCash = round($openingFloat + $cashTendered - $changeGiven, 2);

        $closingBalance = $till->closing_balance !== null ? (float) $till->closing_balance : null;
        $variance = $closingBalance !== null ? round($closingBalance - $expectedCash, 2) : null;

        return [
            'sales_count' => $salesCount,
            'total_sales' => number_format($totalSales, 2, '.', ''),
            'kitchen_orders_count' => $kitchenOrdersCount,
            'till_payments_total' => number_format($tillPaymentsTotal, 2, '.', ''),
            'cash_received' => number_format($cashReceived, 2, '.', ''),
            'cash_tendered' => number_format($cashTendered, 2, '.', ''),
            'change_given' => number_format($changeGiven, 2, '.', ''),
            'card_received' => number_format($cardReceived, 2, '.', ''),
            'momo_received' => number_format($momoReceived, 2, '.', ''),
            'opening_float' => number_format($openingFloat, 2, '.', ''),
            'expected_cash' => number_format($expectedCash, 2, '.', ''),
            'closing_balance' => $closingBalance !== null ? number_format($closingBalance, 2, '.', '') : null,
            'variance' => $variance !== null ? number_format($variance, 2, '.', '') : null,
        ];
    }

    private function aggregateBarSale(Till $till, User $user): void
    {
        $orders = $till->kitchenOrders()
            ->whereNotIn('status', [KitchenOrderStatus::Rejected, KitchenOrderStatus::Cancelled])
            ->with('items')
            ->get();

        if ($orders->isEmpty()) {
            return;
        }

        $subtotal = (float) $orders->sum('total');

        // Apply till-level discount
        $discount = 0;
        $discountInput = $till->discount_input ? (float) $till->discount_input : null;
        $discountType = $till->discount_type;

        if ($discountInput && $discountType) {
            if ($discountType === DiscountType::Percent) {
                $discount = round($subtotal * ($discountInput / 100), 2);
            } else {
                $discount = round(min($discountInput, $subtotal), 2);
            }
        }

        $total = round($subtotal - $discount, 2);

        $sale = Sale::create([
            'shop_id' => $till->shop_id,
            'branch_id' => $till->branch_id,
            'till_id' => $till->id,
            'cashier_id' => $user->id,
            'subtotal' => $subtotal,
            'tax' => 0,
            'discount' => $discount,
            'discount_input' => $discountInput,
            'discount_type' => $discountType,
            'total' => $total,
            'status' => SaleStatus::Completed,
            'source' => SaleSource::Bar,
            'verify_token' => Str::random(12),
        ]);

        // Create sale items from kitchen order items
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $product = $item->product;

                $sale->items()->create([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $product ? $product->price : 0,
                    'discount' => 0,
                    'line_total' => $product ? $product->price * $item->quantity : 0,
                ]);
            }
        }

        // Create sale payments from till payments
        $tillPayments = TillPayment::where('till_id', $till->id)->get();

        foreach ($tillPayments as $tillPayment) {
            $sale->payments()->create([
                'method' => PayMethod::from($tillPayment->method->value),
                'amount' => $tillPayment->amount,
                'amount_tendered' => $tillPayment->amount_tendered ?? $tillPayment->amount,
                'change_given' => $tillPayment->change_given ?? 0,
                'card_type' => $tillPayment->card_type,
                'card_trans_no' => $tillPayment->card_trans_no,
                'momo_provider' => $tillPayment->momo_provider,
                'momo_phone' => $tillPayment->momo_phone,
                'momo_ref' => $tillPayment->momo_trans_id,
            ]);
        }

        // Link kitchen orders to the aggregated sale
        foreach ($orders as $order) {
            $order->update(['sale_id' => $sale->id]);
        }
    }
}
