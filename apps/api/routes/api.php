<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\TokenController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UnitOfMeasureController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;
use ShopChain\Core\Models\GoodsReceipt;
use ShopChain\Core\Models\PurchaseOrder;
use ShopChain\Core\Models\StockAdjustment;
use ShopChain\Core\Models\StockTransfer;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['status' => 'ok']));

    // Public auth routes
    Route::prefix('auth')->middleware('throttle:auth')->group(function () {
        Route::post('/register', [RegisterController::class, 'register']);
        Route::post('/login', [LoginController::class, 'login']);
    });

    Route::post('/auth/two-factor/verify', [TwoFactorController::class, 'verify'])
        ->middleware('throttle:two-factor');

    Route::post('/auth/refresh', [TokenController::class, 'refresh']);

    // Authenticated auth routes
    Route::prefix('auth')->middleware(['auth:api', 'active_user'])->group(function () {
        Route::post('/logout', [TokenController::class, 'logout']);
        Route::get('/me', [TokenController::class, 'me']);

        Route::prefix('two-factor')->group(function () {
            Route::post('/enable', [TwoFactorController::class, 'enable']);
            Route::post('/confirm', [TwoFactorController::class, 'confirm']);
            Route::delete('/', [TwoFactorController::class, 'disable']);
            Route::get('/recovery-codes', [TwoFactorController::class, 'recoveryCodes']);
            Route::post('/recovery-codes', [TwoFactorController::class, 'regenerate']);
        });
    });

    // User-scoped shop routes (no shop context)
    Route::middleware(['auth:api', 'active_user'])->group(function () {
        Route::get('/shops', [ShopController::class, 'index']);
        Route::post('/shops', [ShopController::class, 'store']);
    });

    // Shop-scoped routes (tenant context)
    Route::prefix('shops/{shop}')
        ->middleware(['auth:api', 'active_user', 'set_shop', 'shop_member'])
        ->group(function () {
            Route::get('/', [ShopController::class, 'show']);
            Route::patch('/', [ShopController::class, 'update']);
            Route::delete('/', [ShopController::class, 'destroy']);

            Route::get('/settings', [ShopController::class, 'settings']);
            Route::patch('/settings', [ShopController::class, 'updateSettings']);

            Route::post('/logo', [ShopController::class, 'uploadLogo']);
            Route::delete('/logo', [ShopController::class, 'deleteLogo']);

            Route::get('/plan-usage', [ShopController::class, 'planUsage']);

            // Branches
            Route::apiResource('branches', BranchController::class)
                ->except('store');
            Route::post('branches', [BranchController::class, 'store'])
                ->middleware('enforce_plan:branchesPerShop');

            // Categories
            Route::apiResource('categories', CategoryController::class);

            // Units of Measure
            Route::apiResource('units', UnitOfMeasureController::class);

            // Products
            Route::apiResource('products', ProductController::class)->except('store');
            Route::post('products', [ProductController::class, 'store'])
                ->middleware('enforce_plan:productsPerShop');

            // Product sub-resources
            Route::patch('products/{product}/price', [ProductController::class, 'updatePrice']);
            Route::get('products/{product}/price-history', [ProductController::class, 'priceHistory']);
            Route::get('products/{product}/batches', [ProductController::class, 'batches']);
            Route::post('products/{product}/batches', [ProductController::class, 'storeBatch']);
            Route::patch('products/{product}/batches/{batch}', [ProductController::class, 'updateBatch'])
                ->scopeBindings();

            // Explicit model bindings
            Route::model('adjustment', StockAdjustment::class);
            Route::model('transfer', StockTransfer::class);
            Route::model('receipt', GoodsReceipt::class);
            Route::model('po', PurchaseOrder::class);

            // Warehouses
            Route::apiResource('warehouses', WarehouseController::class)->except('store');
            Route::post('warehouses', [WarehouseController::class, 'store'])
                ->middleware('enforce_plan:warehouses');

            // Stock Adjustments
            Route::get('adjustments', [StockAdjustmentController::class, 'index']);
            Route::post('adjustments', [StockAdjustmentController::class, 'store']);
            Route::get('adjustments/{adjustment}', [StockAdjustmentController::class, 'show']);
            Route::post('adjustments/{adjustment}/approve', [StockAdjustmentController::class, 'approve']);
            Route::post('adjustments/{adjustment}/reject', [StockAdjustmentController::class, 'reject']);

            // Stock Transfers
            Route::get('transfers', [StockTransferController::class, 'index']);
            Route::post('transfers', [StockTransferController::class, 'store']);
            Route::get('transfers/{transfer}', [StockTransferController::class, 'show']);
            Route::patch('transfers/{transfer}', [StockTransferController::class, 'update']);

            // Goods Receipts
            Route::get('goods-receipts', [GoodsReceiptController::class, 'index']);
            Route::post('goods-receipts', [GoodsReceiptController::class, 'store']);
            Route::get('goods-receipts/{receipt}', [GoodsReceiptController::class, 'show']);
            Route::patch('goods-receipts/{receipt}', [GoodsReceiptController::class, 'update']);

            // Suppliers
            Route::apiResource('suppliers', SupplierController::class)->except('store');
            Route::post('suppliers', [SupplierController::class, 'store'])
                ->middleware('enforce_plan:suppliers');

            // Supplier-Product sub-resources
            Route::get('suppliers/{supplier}/products', [SupplierController::class, 'products']);
            Route::post('suppliers/{supplier}/products', [SupplierController::class, 'linkProduct']);
            Route::delete('suppliers/{supplier}/products/{product}', [SupplierController::class, 'unlinkProduct']);

            // Purchase Orders
            Route::get('purchase-orders', [PurchaseOrderController::class, 'index']);
            Route::post('purchase-orders', [PurchaseOrderController::class, 'store']);
            Route::get('purchase-orders/{po}', [PurchaseOrderController::class, 'show']);
            Route::post('purchase-orders/{po}/submit', [PurchaseOrderController::class, 'submit']);
            Route::post('purchase-orders/{po}/approve', [PurchaseOrderController::class, 'approve']);
            Route::post('purchase-orders/{po}/ship', [PurchaseOrderController::class, 'ship']);
            Route::post('purchase-orders/{po}/receive', [PurchaseOrderController::class, 'receive']);
            Route::post('purchase-orders/{po}/cancel', [PurchaseOrderController::class, 'cancel']);
        });

    // Admin auth routes
    Route::prefix('admin/auth')->group(function () {
        Route::post('/login', [AdminAuthController::class, 'login'])
            ->middleware('throttle:auth');
        Route::post('/two-factor/verify', [AdminAuthController::class, 'twoFactorVerify'])
            ->middleware('throttle:two-factor');
        Route::post('/logout', [AdminAuthController::class, 'logout'])
            ->middleware(['auth:api', 'active_user', 'admin']);
    });
});
