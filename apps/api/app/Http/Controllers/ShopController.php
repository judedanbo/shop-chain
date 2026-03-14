<?php

namespace App\Http\Controllers;

use App\Services\PlanEnforcementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Shop;

class ShopController extends Controller
{
    public function planUsage(Request $request, Shop $shop): JsonResponse
    {
        $member = $request->attributes->get('shop_member');
        $service = app(PlanEnforcementService::class);

        return response()->json([
            'plan' => $shop->activePlan->only(['id', 'name', 'price', 'features']),
            'usage' => $service->computeUsage($shop),
            'is_decision_maker' => in_array($member->role, [
                ShopRole::Owner,
                ShopRole::GeneralManager,
                ShopRole::Manager,
            ]),
        ]);
    }
}
