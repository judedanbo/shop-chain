<?php

use App\Http\Middleware\EnforcePlanLimits;
use App\Http\Middleware\EnsureActiveUser;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureBranchAccess;
use App\Http\Middleware\EnsureFeatureActive;
use App\Http\Middleware\EnsureShopMember;
use App\Http\Middleware\SetCurrentShop;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'active_user' => EnsureActiveUser::class,
            'admin' => EnsureAdmin::class,
            'set_shop' => SetCurrentShop::class,
            'shop_member' => EnsureShopMember::class,
            'branch_access' => EnsureBranchAccess::class,
            'enforce_plan' => EnforcePlanLimits::class,
            'feature' => EnsureFeatureActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
