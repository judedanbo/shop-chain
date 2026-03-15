<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Subscription;
use ShopChain\Core\Services\SubscriptionService;

class HandleGracePeriod extends Command
{
    protected $signature = 'shopchain:handle-grace-period';

    protected $description = 'Expire PastDue subscriptions that have exceeded the grace period';

    public function handle(SubscriptionService $service): int
    {
        $graceDays = config('shopchain.billing.grace_period_days', 3);

        $subscriptions = Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::PastDue)
            ->where('expires_at', '<', now()->subDays($graceDays))
            ->get();

        $count = 0;

        foreach ($subscriptions as $subscription) {
            $service->expire($subscription);
            $count++;
        }

        $this->info("Expired {$count} past-due subscriptions after grace period.");

        return self::SUCCESS;
    }
}
