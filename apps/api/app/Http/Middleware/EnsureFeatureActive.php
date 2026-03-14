<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Pennant\Feature;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureActive
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $shop = $request->route('shop');

        if (! Feature::for($shop)->active($feature)) {
            return response()->json([
                'message' => 'This feature is not available on your current plan.',
                'feature' => $feature,
                'plan' => $shop->activePlan->id,
            ], 403);
        }

        return $next($request);
    }
}
