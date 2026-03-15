<?php

namespace ShopChain\Core;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use ShopChain\Core\Events\AdjustmentPending;
use ShopChain\Core\Events\BatchExpiringSoon;
use ShopChain\Core\Events\DiscountApplied;
use ShopChain\Core\Events\LowStockDetected;
use ShopChain\Core\Events\PlanLimitWarning;
use ShopChain\Core\Events\PurchaseOrderStatusChanged;
use ShopChain\Core\Events\ReversalDirect;
use ShopChain\Core\Events\ReversalRequested;
use ShopChain\Core\Events\ReversalResolved;
use ShopChain\Core\Events\SaleCompleted;
use ShopChain\Core\Events\TeamMemberJoined;
use ShopChain\Core\Listeners\SendAdjustmentPendingNotification;
use ShopChain\Core\Listeners\SendBatchExpiryNotification;
use ShopChain\Core\Listeners\SendDiscountAppliedNotification;
use ShopChain\Core\Listeners\SendLowStockNotification;
use ShopChain\Core\Listeners\SendPlanLimitWarningNotification;
use ShopChain\Core\Listeners\SendPOStatusChangeNotification;
use ShopChain\Core\Listeners\SendReversalDirectNotification;
use ShopChain\Core\Listeners\SendReversalRequestedNotification;
use ShopChain\Core\Listeners\SendReversalResolvedNotification;
use ShopChain\Core\Listeners\SendSaleCompletedNotification;
use ShopChain\Core\Listeners\SendTeamMemberJoinedNotification;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Category;
use ShopChain\Core\Models\Customer;
use ShopChain\Core\Models\GoodsReceipt;
use ShopChain\Core\Models\PosHeldOrder;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\PurchaseOrder;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\StockAdjustment;
use ShopChain\Core\Models\StockTransfer;
use ShopChain\Core\Models\Supplier;
use ShopChain\Core\Models\Till;
use ShopChain\Core\Models\UnitOfMeasure;
use ShopChain\Core\Models\Warehouse;
use ShopChain\Core\Policies\BranchPolicy;
use ShopChain\Core\Models\HeldOrder;
use ShopChain\Core\Models\KitchenOrder;
use ShopChain\Core\Models\Notification;
use ShopChain\Core\Models\ShopMember;
use ShopChain\Core\Policies\HeldOrderPolicy;
use ShopChain\Core\Policies\KitchenOrderPolicy;
use ShopChain\Core\Policies\NotificationPolicy;
use ShopChain\Core\Policies\ShopMemberPolicy;
use ShopChain\Core\Policies\CategoryPolicy;
use ShopChain\Core\Policies\CustomerPolicy;
use ShopChain\Core\Policies\GoodsReceiptPolicy;
use ShopChain\Core\Policies\PosHeldOrderPolicy;
use ShopChain\Core\Policies\ProductPolicy;
use ShopChain\Core\Policies\PurchaseOrderPolicy;
use ShopChain\Core\Policies\SalePolicy;
use ShopChain\Core\Policies\ShopPolicy;
use ShopChain\Core\Policies\StockAdjustmentPolicy;
use ShopChain\Core\Policies\StockTransferPolicy;
use ShopChain\Core\Policies\SupplierPolicy;
use ShopChain\Core\Policies\TillPolicy;
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
        Gate::policy(Supplier::class, SupplierPolicy::class);
        Gate::policy(PurchaseOrder::class, PurchaseOrderPolicy::class);
        Gate::policy(Sale::class, SalePolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(PosHeldOrder::class, PosHeldOrderPolicy::class);
        Gate::policy(Till::class, TillPolicy::class);
        Gate::policy(HeldOrder::class, HeldOrderPolicy::class);
        Gate::policy(KitchenOrder::class, KitchenOrderPolicy::class);
        Gate::policy(ShopMember::class, ShopMemberPolicy::class);
        Gate::policy(Notification::class, NotificationPolicy::class);

        // Event-Listener bindings for notifications
        Event::listen(LowStockDetected::class, SendLowStockNotification::class);
        Event::listen(BatchExpiringSoon::class, SendBatchExpiryNotification::class);
        Event::listen(SaleCompleted::class, SendSaleCompletedNotification::class);
        Event::listen(DiscountApplied::class, SendDiscountAppliedNotification::class);
        Event::listen(ReversalRequested::class, SendReversalRequestedNotification::class);
        Event::listen(ReversalResolved::class, SendReversalResolvedNotification::class);
        Event::listen(ReversalDirect::class, SendReversalDirectNotification::class);
        Event::listen(PurchaseOrderStatusChanged::class, SendPOStatusChangeNotification::class);
        Event::listen(AdjustmentPending::class, SendAdjustmentPendingNotification::class);
        Event::listen(TeamMemberJoined::class, SendTeamMemberJoinedNotification::class);
        Event::listen(PlanLimitWarning::class, SendPlanLimitWarningNotification::class);

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/shopchain.php' => config_path('shopchain.php'),
            ], 'shopchain-config');
        }
    }
}
