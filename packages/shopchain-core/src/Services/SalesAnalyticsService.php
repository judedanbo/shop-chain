<?php

namespace ShopChain\Core\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\SaleItem;
use ShopChain\Core\Models\SalePayment;
use ShopChain\Core\Models\Shop;

class SalesAnalyticsService
{
    /**
     * @return array<string, mixed>
     */
    public function getAnalytics(Shop $shop, ?string $branchId = null): array
    {
        $base = Sale::query()
            ->where('status', SaleStatus::Completed)
            ->when($branchId, fn (Builder $q) => $q->where('branch_id', $branchId));

        return [
            'kpis' => $this->getKpis(clone $base),
            'period_comparison' => $this->getPeriodComparison(clone $base),
            'charts' => [
                'seven_day_revenue' => $this->getSevenDayRevenue(clone $base),
                'payment_methods' => $this->getPaymentMethods(clone $base),
                'hourly_distribution' => $this->getHourlyDistribution(clone $base),
                'top_products' => $this->getTopProducts(clone $base),
                'customer_mix' => $this->getCustomerMix(clone $base),
            ],
            'projections' => $this->getProjections(clone $base),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function getKpis(Builder $base): array
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        $todayStats = (clone $base)
            ->whereDate('created_at', $today)
            ->selectRaw('COALESCE(SUM(total), 0) as revenue, COUNT(*) as transactions, COALESCE(SUM(discount), 0) as discounts')
            ->first();

        $yesterdayStats = (clone $base)
            ->whereDate('created_at', $yesterday)
            ->selectRaw('COALESCE(SUM(total), 0) as revenue, COUNT(*) as transactions')
            ->first();

        $todayRevenue = (float) $todayStats->revenue;
        $yesterdayRevenue = (float) $yesterdayStats->revenue;
        $changePercent = $yesterdayRevenue > 0
            ? round(($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue * 100, 1)
            : null;

        $todayItemsSold = SaleItem::query()
            ->whereHas('sale', function (Builder $q) use ($base, $today) {
                $q->mergeConstraintsFrom(
                    (clone $base)->whereDate('created_at', $today)
                );
            })
            ->selectRaw('COALESCE(SUM(quantity), 0) as total_quantity')
            ->value('total_quantity');

        $todayTransactions = (int) $todayStats->transactions;
        $avgOrderValue = $todayTransactions > 0
            ? $todayRevenue / $todayTransactions
            : 0;

        $todayDiscounts = (float) $todayStats->discounts;
        $todayGross = $todayRevenue + $todayDiscounts;
        $discountPercent = $todayGross > 0
            ? round($todayDiscounts / $todayGross * 100, 1)
            : 0;

        return [
            'todays_revenue' => [
                'amount' => $this->formatMoney($todayRevenue),
                'change_percent' => $changePercent,
            ],
            'transactions' => [
                'count' => $todayTransactions,
                'yesterday_count' => (int) $yesterdayStats->transactions,
            ],
            'avg_order_value' => [
                'amount' => $this->formatMoney($avgOrderValue),
                'items_sold' => (int) $todayItemsSold,
            ],
            'discounts_given' => [
                'amount' => $this->formatMoney($todayDiscounts),
                'percent_of_gross' => $discountPercent,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function getPeriodComparison(Builder $base): array
    {
        $today = Carbon::today();

        $periods = [
            'today' => [Carbon::today(), Carbon::today()->endOfDay()],
            'yesterday' => [Carbon::yesterday(), Carbon::yesterday()->endOfDay()],
            'this_week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfDay()],
            'this_month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfDay()],
        ];

        $result = [];

        foreach ($periods as $key => [$start, $end]) {
            $stats = (clone $base)
                ->whereBetween('created_at', [$start, $end])
                ->selectRaw('COALESCE(SUM(total), 0) as revenue, COUNT(*) as transactions, COALESCE(SUM(discount), 0) as discounts')
                ->first();

            $itemsSold = SaleItem::query()
                ->whereHas('sale', function (Builder $q) use ($base, $start, $end) {
                    $q->mergeConstraintsFrom(
                        (clone $base)->whereBetween('created_at', [$start, $end])
                    );
                })
                ->selectRaw('COALESCE(SUM(quantity), 0) as total_quantity')
                ->value('total_quantity');

            $result[$key] = [
                'revenue' => $this->formatMoney((float) $stats->revenue),
                'transactions' => (int) $stats->transactions,
                'items_sold' => (int) $itemsSold,
                'discounts' => $this->formatMoney((float) $stats->discounts),
            ];
        }

        return $result;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getSevenDayRevenue(Builder $base): array
    {
        $startDate = Carbon::today()->subDays(6);

        $rows = (clone $base)
            ->where('created_at', '>=', $startDate)
            ->selectRaw("DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue")
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->get();

        $revenueByDate = $rows->pluck('revenue', 'date')->all();

        $result = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $result[] = [
                'date' => $date,
                'revenue' => $this->formatMoney((float) ($revenueByDate[$date] ?? 0)),
            ];
        }

        return $result;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getPaymentMethods(Builder $base): array
    {
        $today = Carbon::today();

        $payments = SalePayment::query()
            ->whereHas('sale', function (Builder $q) use ($base, $today) {
                $q->mergeConstraintsFrom(
                    (clone $base)->whereDate('created_at', $today)
                );
            })
            ->selectRaw("method, COALESCE(SUM(amount), 0) as total_amount")
            ->groupBy('method')
            ->get();

        $grandTotal = $payments->sum('total_amount');

        return $payments->map(fn ($row) => [
            'method' => $row->method instanceof \BackedEnum ? $row->method->value : $row->method,
            'amount' => $this->formatMoney((float) $row->total_amount),
            'percentage' => $grandTotal > 0
                ? round((float) $row->total_amount / $grandTotal * 100, 1)
                : 0,
        ])->values()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getHourlyDistribution(Builder $base): array
    {
        $today = Carbon::today();

        $rows = (clone $base)
            ->whereDate('created_at', $today)
            ->selectRaw("EXTRACT(HOUR FROM created_at)::int as hour, COALESCE(SUM(total), 0) as revenue, COUNT(*) as transactions")
            ->groupByRaw('EXTRACT(HOUR FROM created_at)')
            ->get()
            ->keyBy('hour');

        $peakHour = $rows->sortByDesc('revenue')->keys()->first();

        $result = [];
        for ($hour = 6; $hour <= 22; $hour++) {
            $row = $rows->get($hour);
            $result[] = [
                'hour' => $hour,
                'revenue' => $this->formatMoney((float) ($row->revenue ?? 0)),
                'transactions' => (int) ($row->transactions ?? 0),
                'is_peak' => $peakHour !== null && $hour === $peakHour,
            ];
        }

        return $result;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getTopProducts(Builder $base, int $limit = 10): array
    {
        $today = Carbon::today();

        return SaleItem::query()
            ->whereHas('sale', function (Builder $q) use ($base, $today) {
                $q->mergeConstraintsFrom(
                    (clone $base)->whereDate('created_at', $today)
                );
            })
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->selectRaw('sale_items.product_id, products.name, COALESCE(SUM(sale_items.quantity), 0) as total_quantity, COALESCE(SUM(sale_items.line_total), 0) as total_revenue')
            ->groupBy('sale_items.product_id', 'products.name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'name' => $row->name,
                'quantity' => (int) $row->total_quantity,
                'revenue' => $this->formatMoney((float) $row->total_revenue),
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function getCustomerMix(Builder $base): array
    {
        $today = Carbon::today();

        $stats = (clone $base)
            ->whereDate('created_at', $today)
            ->selectRaw("
                COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as registered_count,
                COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as walkin_count,
                COALESCE(SUM(CASE WHEN customer_id IS NOT NULL THEN total ELSE 0 END), 0) as registered_revenue,
                COALESCE(SUM(CASE WHEN customer_id IS NULL THEN total ELSE 0 END), 0) as walkin_revenue
            ")
            ->first();

        $total = (int) $stats->registered_count + (int) $stats->walkin_count;

        return [
            'registered' => [
                'count' => (int) $stats->registered_count,
                'percentage' => $total > 0 ? round((int) $stats->registered_count / $total * 100, 1) : 0,
                'revenue' => $this->formatMoney((float) $stats->registered_revenue),
            ],
            'walk_in' => [
                'count' => (int) $stats->walkin_count,
                'percentage' => $total > 0 ? round((int) $stats->walkin_count / $total * 100, 1) : 0,
                'revenue' => $this->formatMoney((float) $stats->walkin_revenue),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function getProjections(Builder $base): array
    {
        $startOfMonth = Carbon::now()->startOfMonth();
        $today = Carbon::today();
        $daysElapsed = $startOfMonth->diffInDays($today) + 1;
        $daysInMonth = Carbon::now()->daysInMonth;

        $mtdRevenue = (clone $base)
            ->whereBetween('created_at', [$startOfMonth, $today->copy()->endOfDay()])
            ->selectRaw('COALESCE(SUM(total), 0) as revenue')
            ->value('revenue');

        $mtdRevenue = (float) $mtdRevenue;
        $dailyAverage = $daysElapsed > 0 ? $mtdRevenue / $daysElapsed : 0;

        $startOfWeek = Carbon::now()->startOfWeek();
        $weekDaysElapsed = $startOfWeek->diffInDays($today) + 1;

        $weekRevenue = (clone $base)
            ->whereBetween('created_at', [$startOfWeek, $today->copy()->endOfDay()])
            ->selectRaw('COALESCE(SUM(total), 0) as revenue')
            ->value('revenue');

        $weekDailyAverage = $weekDaysElapsed > 0 ? (float) $weekRevenue / $weekDaysElapsed : 0;

        return [
            'daily_average' => $this->formatMoney($dailyAverage),
            'weekly_projection' => $this->formatMoney($dailyAverage * 7),
            'monthly_projection' => $this->formatMoney($dailyAverage * $daysInMonth),
            'week_daily_average' => $this->formatMoney($weekDailyAverage),
        ];
    }

    private function formatMoney(float $value): string
    {
        return number_format($value, 2, '.', '');
    }
}
