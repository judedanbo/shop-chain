<?php

namespace App\Http\Controllers;

use App\Http\Requests\Adjustment\CreateAdjustmentRequest;
use App\Http\Requests\Adjustment\RejectAdjustmentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\StockAdjustment;
use ShopChain\Core\Resources\StockAdjustmentResource;
use ShopChain\Core\Services\StockAdjustmentService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class StockAdjustmentController extends Controller
{
    public function __construct(private StockAdjustmentService $adjustmentService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', StockAdjustment::class);

        $adjustments = QueryBuilder::for(StockAdjustment::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('product_id'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('warehouse_id'),
                AllowedFilter::exact('branch_id'),
            ])
            ->allowedSorts(['adjustment_date', 'created_at', 'quantity_change', 'status'])
            ->allowedIncludes(['product', 'warehouse', 'branch', 'creator', 'approver'])
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return StockAdjustmentResource::collection($adjustments)->response();
    }

    public function store(CreateAdjustmentRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', StockAdjustment::class);

        $adjustment = $this->adjustmentService->createAdjustment(
            $shop,
            $request->validated(),
            $request->user(),
        );

        return (new StockAdjustmentResource($adjustment))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, StockAdjustment $adjustment): JsonResponse
    {
        $this->authorize('view', $adjustment);

        $adjustment->load(['product', 'warehouse', 'branch', 'creator', 'approver']);

        return (new StockAdjustmentResource($adjustment))->response();
    }

    public function approve(Request $request, Shop $shop, StockAdjustment $adjustment): JsonResponse
    {
        $this->authorize('approve', $adjustment);

        $adjustment = $this->adjustmentService->approveAdjustment($adjustment, $request->user());

        return (new StockAdjustmentResource($adjustment))->response();
    }

    public function reject(RejectAdjustmentRequest $request, Shop $shop, StockAdjustment $adjustment): JsonResponse
    {
        $this->authorize('reject', $adjustment);

        $adjustment = $this->adjustmentService->rejectAdjustment(
            $adjustment,
            $request->user(),
            $request->validated('reason'),
        );

        return (new StockAdjustmentResource($adjustment))->response();
    }
}
