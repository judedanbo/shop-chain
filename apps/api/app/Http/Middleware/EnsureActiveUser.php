<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use ShopChain\Core\Enums\UserStatus;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->status !== UserStatus::Active) {
            return response()->json([
                'message' => 'Your account is not active.',
            ], 403);
        }

        // Throttled last_active_at update — only if >5 min stale
        if (! $user->last_active_at || $user->last_active_at->lt(now()->subMinutes(5))) {
            $user->updateQuietly(['last_active_at' => now()]);
        }

        return $next($request);
    }
}
