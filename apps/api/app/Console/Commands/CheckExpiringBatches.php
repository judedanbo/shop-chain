<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use ShopChain\Core\Enums\BatchStatus;
use ShopChain\Core\Events\BatchExpiringSoon;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Shop;

class CheckExpiringBatches extends Command
{
    protected $signature = 'shopchain:check-expiring-batches';

    protected $description = 'Check for batches expiring within 30 days and dispatch alerts';

    public function handle(): int
    {
        $threshold = now()->addDays(30);

        Batch::withoutGlobalScopes()
            ->where('status', BatchStatus::Active)
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $threshold)
            ->where('expiry_date', '>', now())
            ->each(function (Batch $batch) {
                $shop = Shop::withoutGlobalScopes()->find($batch->shop_id);

                if ($shop) {
                    $daysUntilExpiry = (int) now()->diffInDays($batch->expiry_date);

                    event(new BatchExpiringSoon($shop, $batch, $daysUntilExpiry));
                }
            });

        $this->info('Expiring batches check completed.');

        return self::SUCCESS;
    }
}
