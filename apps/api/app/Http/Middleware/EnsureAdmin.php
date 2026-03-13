<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use ShopChain\Core\Enums\AdminTeamStatus;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $adminUser = $user?->adminUser;

        if (! $adminUser || $adminUser->status !== AdminTeamStatus::Active) {
            return response()->json([
                'message' => 'Admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
