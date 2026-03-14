<?php

namespace ShopChain\Core;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Policies\BranchPolicy;
use ShopChain\Core\Policies\ShopPolicy;

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

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/shopchain.php' => config_path('shopchain.php'),
            ], 'shopchain-config');
        }
    }
}
