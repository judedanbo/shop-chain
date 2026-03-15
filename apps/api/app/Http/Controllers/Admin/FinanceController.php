<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Services\AdminFinanceService;

class FinanceController extends Controller
{
    public function __construct(private AdminFinanceService $financeService) {}

    public function dashboard(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.billing.manage'), 403);

        return response()->json(['data' => $this->financeService->getDashboard()]);
    }

    public function revenue(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.billing.manage'), 403);

        return response()->json([
            'data' => [
                'by_plan' => $this->financeService->getRevenueByPlan(),
                'monthly' => $this->financeService->getMonthlyRevenue(),
            ],
        ]);
    }

    public function monthlySummary(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.billing.manage'), 403);

        return response()->json(['data' => $this->financeService->getMonthlySummary()]);
    }

    public function expensesByCategory(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.billing.manage'), 403);

        return response()->json(['data' => $this->financeService->getExpensesByCategory()]);
    }

    public function profitAndLoss(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.billing.manage'), 403);

        return response()->json(['data' => $this->financeService->getProfitAndLoss()]);
    }
}
