<?php

namespace ShopChain\Core\Services;

use Illuminate\Support\Facades\DB;
use ShopChain\Core\Enums\BillingStatus;
use ShopChain\Core\Models\AdminExpense;
use ShopChain\Core\Models\BillingRecord;

class AdminFinanceService
{
    public function getDashboard(): array
    {
        $totalRevenue = BillingRecord::withoutGlobalScopes()
            ->where('status', BillingStatus::Paid)
            ->sum('amount');

        $totalExpenses = AdminExpense::sum('amount');

        return [
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_income' => $totalRevenue - $totalExpenses,
        ];
    }

    public function getRevenueByPlan(): array
    {
        return BillingRecord::withoutGlobalScopes()
            ->join('subscriptions', 'billing_records.subscription_id', '=', 'subscriptions.id')
            ->where('billing_records.status', 'paid')
            ->select('subscriptions.plan_id', DB::raw('sum(billing_records.amount) as total'))
            ->groupBy('subscriptions.plan_id')
            ->pluck('total', 'plan_id')
            ->toArray();
    }

    public function getMonthlyRevenue(int $months = 12): array
    {
        return BillingRecord::withoutGlobalScopes()
            ->select(
                DB::raw("to_char(created_at, 'YYYY-MM') as month"),
                DB::raw('sum(amount) as total')
            )
            ->where('status', BillingStatus::Paid)
            ->where('created_at', '>=', now()->subMonths($months)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month')
            ->toArray();
    }

    public function getMonthlySummary(int $months = 12): array
    {
        $startDate = now()->subMonths($months)->startOfMonth();

        $revenue = BillingRecord::withoutGlobalScopes()
            ->select(
                DB::raw("to_char(created_at, 'YYYY-MM') as month"),
                DB::raw('sum(amount) as total')
            )
            ->where('status', BillingStatus::Paid)
            ->where('created_at', '>=', $startDate)
            ->groupBy('month')
            ->pluck('total', 'month');

        $expenses = AdminExpense::select(
            DB::raw("to_char(date, 'YYYY-MM') as month"),
            DB::raw('sum(amount) as total')
        )
            ->where('date', '>=', $startDate)
            ->groupBy('month')
            ->pluck('total', 'month');

        $allMonths = $revenue->keys()->merge($expenses->keys())->unique()->sort()->values();

        return $allMonths->map(function ($month) use ($revenue, $expenses) {
            $rev = (float) ($revenue[$month] ?? 0);
            $exp = (float) ($expenses[$month] ?? 0);

            return [
                'month' => $month,
                'revenue' => $rev,
                'expenses' => $exp,
                'net' => $rev - $exp,
            ];
        })->toArray();
    }

    public function getExpensesByCategory(): array
    {
        return AdminExpense::select('category', DB::raw('sum(amount) as total'))
            ->groupBy('category')
            ->pluck('total', 'category')
            ->toArray();
    }

    /**
     * Ghana tax calculations:
     * Corporate Tax: 25%, NHIL: 2.5%, GETFund: 2.5%, COVID Levy: 1%, VAT: 15%
     */
    public function getProfitAndLoss(): array
    {
        $totalRevenue = BillingRecord::withoutGlobalScopes()
            ->where('status', BillingStatus::Paid)
            ->sum('amount');

        $totalExpenses = AdminExpense::sum('amount');
        $grossProfit = $totalRevenue - $totalExpenses;

        $nhil = $totalRevenue * 0.025;
        $getfund = $totalRevenue * 0.025;
        $covidLevy = $totalRevenue * 0.01;
        $vat = ($totalRevenue + $nhil + $getfund + $covidLevy) * 0.15;
        $corporateTax = max(0, $grossProfit * 0.25);

        $totalTax = $nhil + $getfund + $covidLevy + $vat + $corporateTax;
        $netProfit = $grossProfit - $totalTax;

        return [
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'gross_profit' => $grossProfit,
            'taxes' => [
                'nhil' => round($nhil, 2),
                'getfund' => round($getfund, 2),
                'covid_levy' => round($covidLevy, 2),
                'vat' => round($vat, 2),
                'corporate_tax' => round($corporateTax, 2),
                'total' => round($totalTax, 2),
            ],
            'net_profit' => round($netProfit, 2),
        ];
    }
}
