<?php

namespace ShopChain\Core\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Shop;

class SaleCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Shop $shop,
        public Sale $sale,
        public User $cashier,
    ) {}
}
