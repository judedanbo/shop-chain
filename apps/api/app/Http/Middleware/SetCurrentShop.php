<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentShop
{
    public function handle(Request $request, Closure $next): Response
    {
        $shop = $request->route('shop');

        // Layer 1: Laravel container
        app()->instance('current_shop_id', $shop->id);

        // Layer 2: PostgreSQL session variable (for RLS)
        DB::select("SELECT set_config('app.current_shop_id', ?, false)", [$shop->id]);

        // Layer 3: Spatie team scoping
        app(PermissionRegistrar::class)->setPermissionsTeamId($shop->id);

        $response = $next($request);

        // Cleanup (Octane compatibility)
        app()->forgetInstance('current_shop_id');
        DB::select("SELECT set_config('app.current_shop_id', '', false)");

        return $response;
    }
}
