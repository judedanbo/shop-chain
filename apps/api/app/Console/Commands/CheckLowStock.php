<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use ShopChain\Core\Events\LowStockDetected;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Shop;

class CheckLowStock extends Command
{
    protected $signature = 'shopchain:check-low-stock';

    protected $description = 'Check for products below their low-stock threshold and dispatch alerts';

    public function handle(): int
    {
        Shop::query()->each(function (Shop $shop) {
            $products = Product::withoutGlobalScopes()
                ->where('shop_id', $shop->id)
                ->where('low_stock_threshold', '>', 0)
                ->get();

            foreach ($products as $product) {
                $totalQuantity = ProductLocation::where('product_id', $product->id)->sum('quantity');

                if ($totalQuantity <= $product->low_stock_threshold) {
                    $cacheKey = "low_stock:{$product->id}";

                    if (! Cache::has($cacheKey)) {
                        event(new LowStockDetected($shop, $product, (int) $totalQuantity, $product->low_stock_threshold));
                        Cache::put($cacheKey, true, now()->addHours(24));
                    }
                }
            }
        });

        $this->info('Low stock check completed.');

        return self::SUCCESS;
    }
}
