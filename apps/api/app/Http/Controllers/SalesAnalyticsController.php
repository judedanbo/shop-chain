<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Services\SalesAnalyticsService;

class SalesAnalyticsController extends Controller
{
    public function __construct(private SalesAnalyticsService $service) {}

    public function __invoke(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAnalytics', Sale::class);

        return response()->json([
            'data' => $this->service->getAnalytics($shop, $request->query('branch_id')),
        ]);
    }
}
