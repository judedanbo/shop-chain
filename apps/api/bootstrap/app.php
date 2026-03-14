<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'active_user' => \App\Http\Middleware\EnsureActiveUser::class,
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'set_shop' => \App\Http\Middleware\SetCurrentShop::class,
            'shop_member' => \App\Http\Middleware\EnsureShopMember::class,
            'branch_access' => \App\Http\Middleware\EnsureBranchAccess::class,
            'enforce_plan' => \App\Http\Middleware\EnforcePlanLimits::class,
            'feature' => \App\Http\Middleware\EnsureFeatureActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
