<?php

namespace ShopChain\Core\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Shop;

class LowStockDetected
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Shop $shop,
        public Product $product,
        public int $currentQuantity,
        public int $threshold,
    ) {}
}
