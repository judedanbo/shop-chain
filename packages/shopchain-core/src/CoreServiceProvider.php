<?php

namespace ShopChain\Core;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Category;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\GoodsReceipt;
use ShopChain\Core\Models\StockAdjustment;
use ShopChain\Core\Models\StockTransfer;
use ShopChain\Core\Models\UnitOfMeasure;
use ShopChain\Core\Models\Warehouse;
use ShopChain\Core\Policies\BranchPolicy;
use ShopChain\Core\Policies\CategoryPolicy;
use ShopChain\Core\Policies\GoodsReceiptPolicy;
use ShopChain\Core\Policies\ProductPolicy;
use ShopChain\Core\Policies\ShopPolicy;
use ShopChain\Core\Policies\StockAdjustmentPolicy;
use ShopChain\Core\Policies\StockTransferPolicy;
use ShopChain\Core\Policies\UnitOfMeasurePolicy;
use ShopChain\Core\Policies\WarehousePolicy;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../config/shopchain.php',
            'shopchain',
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        Gate::policy(Shop::class, ShopPolicy::class);
        Gate::policy(Branch::class, BranchPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(UnitOfMeasure::class, UnitOfMeasurePolicy::class);
        Gate::policy(Warehouse::class, WarehousePolicy::class);
        Gate::policy(StockAdjustment::class, StockAdjustmentPolicy::class);
        Gate::policy(StockTransfer::class, StockTransferPolicy::class);
        Gate::policy(GoodsReceipt::class, GoodsReceiptPolicy::class);

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/shopchain.php' => config_path('shopchain.php'),
            ], 'shopchain-config');
        }
    }
}
