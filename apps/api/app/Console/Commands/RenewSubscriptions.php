<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Subscription;
use ShopChain\Core\Services\SubscriptionService;

class RenewSubscriptions extends Command
{
    protected $signature = 'shopchain:renew-subscriptions';

    protected $description = 'Renew subscriptions expiring within 24 hours with auto_renew enabled';

    public function handle(SubscriptionService $service): int
    {
        $subscriptions = Subscription::withoutGlobalScopes()
            ->where('status', SubscriptionStatus::Active)
            ->where('auto_renew', true)
            ->where('expires_at', '<=', now()->addDay())
            ->where('expires_at', '>', now())
            ->get();

        $count = 0;

        foreach ($subscriptions as $subscription) {
            $service->renew($subscription);
            $count++;
        }

        $this->info("Renewed {$count} subscriptions.");

        return self::SUCCESS;
    }
}
