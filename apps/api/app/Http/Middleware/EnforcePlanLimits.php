<?php

namespace App\Http\Middleware;

use App\Services\PlanEnforcementService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforcePlanLimits
{
    public function handle(Request $request, Closure $next, string $resourceKey): Response
    {
        $shop = $request->route('shop');
        $member = $request->attributes->get('shop_member');

        $service = app(PlanEnforcementService::class);

        if (! $service->canAdd($shop, $resourceKey, $member)) {
            $plan = $shop->activePlan;
            $max = $plan->limits[$resourceKey] ?? 0;

            return response()->json([
                'message' => "Your {$plan->name} plan limit for this resource has been reached.",
                'limit' => $resourceKey,
                'max' => $max,
                'plan' => $plan->id,
            ], 403);
        }

        return $next($request);
    }
}
