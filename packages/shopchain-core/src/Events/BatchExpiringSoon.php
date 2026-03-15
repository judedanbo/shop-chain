<?php

namespace ShopChain\Core\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Shop;

class BatchExpiringSoon
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Shop $shop,
        public Batch $batch,
        public int $daysUntilExpiry,
    ) {}
}
