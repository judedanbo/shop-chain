<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Services\AdminDashboardService;

class DashboardController extends Controller
{
    public function __construct(private AdminDashboardService $dashboardService) {}

    public function overview(): JsonResponse
    {
        return response()->json([
            'data' => [
                ...$this->dashboardService->getOverviewKpis(),
                'plan_distribution' => $this->dashboardService->getPlanDistribution(),
                'recent_activity' => $this->dashboardService->getRecentActivity(),
            ],
        ]);
    }

    public function userGrowth(): JsonResponse
    {
        return response()->json([
            'data' => $this->dashboardService->getUserGrowth(),
        ]);
    }

    public function revenueTrend(): JsonResponse
    {
        return response()->json([
            'data' => $this->dashboardService->getRevenueTrend(),
        ]);
    }
}
