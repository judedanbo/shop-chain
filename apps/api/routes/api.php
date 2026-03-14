<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\TokenController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

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
