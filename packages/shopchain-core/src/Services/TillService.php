<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Till;

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

        $till->update([
            'is_active' => false,
            'closed_at' => now(),
            'closed_by' => $user->id,
            'closing_balance' => $data['closing_balance'],
        ]);

        return $till->load(['branch', 'openedBy', 'closedBy'])->loadCount('sales');
    }

    /**
     * @return array<string, mixed>
     */
    public function getTillSummary(Till $till): array
    {
        $sales = $till->sales()
            ->where('status', SaleStatus::Completed)
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

        $openingFloat = (float) $till->opening_float;
        $expectedCash = round($openingFloat + $cashTendered - $changeGiven, 2);

        $closingBalance = $till->closing_balance !== null ? (float) $till->closing_balance : null;
        $variance = $closingBalance !== null ? round($closingBalance - $expectedCash, 2) : null;

        return [
            'sales_count' => $salesCount,
            'total_sales' => number_format($totalSales, 2, '.', ''),
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
}
