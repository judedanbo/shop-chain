<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseOrder\CreatePurchaseOrderRequest;
use App\Http\Requests\PurchaseOrder\ReceivePurchaseOrderRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\PurchaseOrder;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\PurchaseOrderResource;
use ShopChain\Core\Services\PurchaseOrderService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PurchaseOrderController extends Controller
{
    public function __construct(private PurchaseOrderService $poService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', PurchaseOrder::class);

        $orders = QueryBuilder::for(PurchaseOrder::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('supplier_id'),
                AllowedFilter::exact('warehouse_id'),
            ])
            ->allowedSorts(['created_at', 'expected_date', 'status'])
            ->allowedIncludes(['supplier', 'warehouse', 'creator', 'items'])
            ->defaultSort('-created_at')
            ->withCount('items')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return PurchaseOrderResource::collection($orders)->response();
    }

    public function store(CreatePurchaseOrderRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', PurchaseOrder::class);

        $po = $this->poService->createPO($shop, $request->validated(), $request->user());

        return (new PurchaseOrderResource($po))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, PurchaseOrder $po): JsonResponse
    {
        $this->authorize('view', $po);

        $po->load(['supplier', 'warehouse', 'creator', 'approver', 'items.product'])->loadCount('items');

        return (new PurchaseOrderResource($po))->response();
    }

    public function submit(Request $request, Shop $shop, PurchaseOrder $po): JsonResponse
    {
        $this->authorize('update', $po);

        $po = $this->poService->submitPO($po);

        return (new PurchaseOrderResource($po))->response();
    }

    public function approve(Request $request, Shop $shop, PurchaseOrder $po): JsonResponse
    {
        $this->authorize('approve', $po);

        $po = $this->poService->approvePO($po, $request->user());

        return (new PurchaseOrderResource($po))->response();
    }

    public function ship(Request $request, Shop $shop, PurchaseOrder $po): JsonResponse
    {
        $this->authorize('update', $po);

        $po = $this->poService->markShipped($po);

        return (new PurchaseOrderResource($po))->response();
    }

    public function receive(ReceivePurchaseOrderRequest $request, Shop $shop, PurchaseOrder $po): JsonResponse
    {
        $this->authorize('update', $po);

        $po = $this->poService->receivePO($po, $request->validated('items'));

        return (new PurchaseOrderResource($po))->response();
    }

    public function cancel(Request $request, Shop $shop, PurchaseOrder $po): JsonResponse
    {
        $this->authorize('update', $po);

        $po = $this->poService->cancelPO($po);

        return (new PurchaseOrderResource($po))->response();
    }
}
