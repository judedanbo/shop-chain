<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use ShopChain\Core\Enums\BillingStatus;
use ShopChain\Core\Enums\ShopStatus;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\AuditEvent;
use ShopChain\Core\Models\BillingRecord;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Subscription;

class AdminDashboardService
{
    public function getOverviewKpis(): array
    {
        $totalUsers = User::count();
        $activeUsers = User::where('last_active_at', '>=', now()->subDays(30))->count();
        $totalShops = Shop::withoutGlobalScopes()->count();
        $activeShops = Shop::withoutGlobalScopes()->where('status', ShopStatus::Active)->count();

        $activeSubscriptions = Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::Active)
            ->count();

        $mrr = BillingRecord::withoutGlobalScopes()
            ->where('status', BillingStatus::Paid)
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('amount');

        $arpu = $activeSubscriptions > 0 ? (int) round($mrr / $activeSubscriptions) : 0;

        $newSignupsThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();

        return [
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'total_shops' => $totalShops,
            'active_shops' => $activeShops,
            'mrr' => $mrr,
            'active_subscriptions' => $activeSubscriptions,
            'arpu' => $arpu,
            'new_signups_this_month' => $newSignupsThisMonth,
        ];
    }

    public function getPlanDistribution(): array
    {
        return Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::Active)
            ->select('plan_id', DB::raw('count(*) as count'))
            ->groupBy('plan_id')
            ->pluck('count', 'plan_id')
            ->toArray();
    }

    public function getRecentActivity(int $limit = 8): Collection
    {
        return AuditEvent::with('actor', 'shop')
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function getUserGrowth(int $months = 12): array
    {
        return User::select(
            DB::raw("to_char(created_at, 'YYYY-MM') as month"),
            DB::raw('count(*) as count')
        )
            ->where('created_at', '>=', now()->subMonths($months)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();
    }

    public function getRevenueTrend(int $months = 12): array
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
}
