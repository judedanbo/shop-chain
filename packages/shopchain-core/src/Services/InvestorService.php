<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use ShopChain\Core\Enums\BillingStatus;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\BillingRecord;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Subscription;

class InvestorService
{
    public function getEngagementMetrics(): array
    {
        $now = now();

        $dau = User::where('last_active_at', '>=', $now->copy()->subDay())->count();
        $wau = User::where('last_active_at', '>=', $now->copy()->subWeek())->count();
        $mau = User::where('last_active_at', '>=', $now->copy()->subMonth())->count();

        return [
            'dau' => $dau,
            'wau' => $wau,
            'mau' => $mau,
            'dau_mau_ratio' => $mau > 0 ? round($dau / $mau, 4) : 0,
        ];
    }

    public function getConversionFunnel(): array
    {
        $totalSignups = User::count();
        $activated = User::whereHas('ownedShops')->count();
        $paid = User::whereHas('ownedShops', function ($q) {
            $q->withoutGlobalScopes()->whereHas('subscriptions', function ($sq) {
                $sq->where('status', SubscriptionStatus::Active)
                    ->whereHas('plan', fn ($pq) => $pq->where('price', '>', 0));
            });
        })->count();

        return [
            'signups' => $totalSignups,
            'activated' => $activated,
            'paid' => $paid,
            'signup_to_activation' => $totalSignups > 0 ? round($activated / $totalSignups, 4) : 0,
            'activation_to_paid' => $activated > 0 ? round($paid / $activated, 4) : 0,
        ];
    }

    public function getGrowthMetrics(): array
    {
        $totalUsers = User::count();
        $newThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();

        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();
        $lastMonthUsers = User::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();

        $churned = Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::Cancelled)
            ->where('cancelled_at', '>=', now()->startOfMonth())
            ->count();

        $activeSubscriptions = Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::Active)
            ->count();

        $churnRate = $activeSubscriptions > 0 ? round($churned / ($activeSubscriptions + $churned), 4) : 0;

        return [
            'total_users' => $totalUsers,
            'new_this_month' => $newThisMonth,
            'new_last_month' => $lastMonthUsers,
            'churned' => $churned,
            'net_growth' => $newThisMonth - $churned,
            'churn_rate' => $churnRate,
        ];
    }

    public function getCohortRetention(int $months = 12): array
    {
        $cohorts = [];
        $now = now();

        for ($i = $months - 1; $i >= 0; $i--) {
            $cohortStart = $now->copy()->subMonths($i)->startOfMonth();
            $cohortEnd = $cohortStart->copy()->endOfMonth();
            $cohortKey = $cohortStart->format('Y-m');

            $cohortUsers = User::whereBetween('created_at', [$cohortStart, $cohortEnd])->count();

            if ($cohortUsers === 0) {
                $cohorts[] = ['month' => $cohortKey, 'users' => 0, 'retention' => []];

                continue;
            }

            $retention = [];

            for ($m = 1; $m <= $i; $m++) {
                $checkStart = $cohortStart->copy()->addMonths($m);
                $checkEnd = $checkStart->copy()->endOfMonth();

                $activeInMonth = User::whereBetween('created_at', [$cohortStart, $cohortEnd])
                    ->where('last_active_at', '>=', $checkStart)
                    ->where('last_active_at', '<=', $checkEnd)
                    ->count();

                $retention[] = round($activeInMonth / $cohortUsers, 4);
            }

            $cohorts[] = [
                'month' => $cohortKey,
                'users' => $cohortUsers,
                'retention' => $retention,
            ];
        }

        return $cohorts;
    }

    public function getDeckMetrics(): array
    {
        $totalUsers = User::count();
        $totalShops = Shop::withoutGlobalScopes()->count();
        $mau = User::where('last_active_at', '>=', now()->subMonth())->count();

        $activeSubscriptions = Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::Active)
            ->count();

        $mrr = BillingRecord::withoutGlobalScopes()
            ->where('status', BillingStatus::Paid)
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('amount');

        $arr = $mrr * 12;
        $arpu = $activeSubscriptions > 0 ? (int) round($mrr / $activeSubscriptions) : 0;

        $newThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();

        $paidUsers = Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::Active)
            ->whereHas('plan', fn ($q) => $q->where('price', '>', 0))
            ->count();

        $conversionRate = $totalUsers > 0 ? round($paidUsers / $totalUsers, 4) : 0;

        $churned = Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::Cancelled)
            ->where('cancelled_at', '>=', now()->startOfMonth())
            ->count();

        $churnRate = $activeSubscriptions > 0 ? round($churned / ($activeSubscriptions + $churned), 4) : 0;

        return [
            'total_users' => $totalUsers,
            'total_shops' => $totalShops,
            'mau' => $mau,
            'active_subscriptions' => $activeSubscriptions,
            'mrr' => $mrr,
            'arr' => $arr,
            'arpu' => $arpu,
            'new_users_this_month' => $newThisMonth,
            'paid_users' => $paidUsers,
            'conversion_rate' => $conversionRate,
            'churn_rate' => $churnRate,
            'total_revenue' => BillingRecord::withoutGlobalScopes()->where('status', BillingStatus::Paid)->sum('amount'),
        ];
    }
}
