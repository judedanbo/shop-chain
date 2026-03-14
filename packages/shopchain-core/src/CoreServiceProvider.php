<?php

namespace ShopChain\Core;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Category;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\UnitOfMeasure;
use ShopChain\Core\Policies\BranchPolicy;
use ShopChain\Core\Policies\CategoryPolicy;
use ShopChain\Core\Policies\ProductPolicy;
use ShopChain\Core\Policies\ShopPolicy;
use ShopChain\Core\Policies\UnitOfMeasurePolicy;

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

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/shopchain.php' => config_path('shopchain.php'),
            ], 'shopchain-config');
        }
    }
}
