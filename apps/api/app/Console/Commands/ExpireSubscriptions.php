<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Subscription;
use ShopChain\Core\Services\SubscriptionService;

class ExpireSubscriptions extends Command
{
    protected $signature = 'shopchain:expire-subscriptions';

    protected $description = 'Expire subscriptions past their expiry date with auto_renew disabled';

    public function handle(SubscriptionService $service): int
    {
        $subscriptions = Subscription::withoutGlobalScopes()
            ->whereIn('status', [SubscriptionStatus::Active, SubscriptionStatus::PastDue])
            ->where('auto_renew', false)
            ->where('expires_at', '<', now())
            ->get();

        $count = 0;

        foreach ($subscriptions as $subscription) {
            $service->expire($subscription);
            $count++;
        }

        $this->info("Expired {$count} subscriptions.");

        return self::SUCCESS;
    }
}
