<?php

namespace ShopChain\Core\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use ShopChain\Core\Models\Shop;

class PlanLimitWarning
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Shop $shop,
        public string $resourceKey,
        public float $percentUsed,
    ) {}
}
