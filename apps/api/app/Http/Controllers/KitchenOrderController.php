<?php

namespace App\Http\Controllers;

use App\Http\Requests\KitchenOrder\PlaceKitchenOrderRequest;
use App\Http\Requests\KitchenOrder\RejectKitchenOrderRequest;
use App\Http\Requests\KitchenOrder\ReturnKitchenOrderRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\KitchenOrder;
use ShopChain\Core\Models\KitchenOrderItem;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\KitchenOrderResource;
use ShopChain\Core\Services\KitchenOrderService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class KitchenOrderController extends Controller
{
    public function __construct(private KitchenOrderService $kitchenOrderService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', KitchenOrder::class);

        $orders = QueryBuilder::for(KitchenOrder::class)
            ->allowedFilters([
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('till_id'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('bar_fulfilled'),
                AllowedFilter::partial('table_number'),
            ])
            ->allowedSorts(['created_at'])
            ->allowedIncludes(['items.product', 'server', 'till', 'tillPayments'])
            ->withCount('items')
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return KitchenOrderResource::collection($orders)->response();
    }

    public function store(PlaceKitchenOrderRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', KitchenOrder::class);

        $order = $this->kitchenOrderService->placeOrder(
            $shop,
            $request->validated(),
            $request->user(),
        );

        return (new KitchenOrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, KitchenOrder $kitchenOrder): JsonResponse
    {
        $this->authorize('view', $kitchenOrder);

        $kitchenOrder->load(['items.product', 'server', 'till', 'branch', 'cancelledByUser'])
            ->loadCount('items');

        return (new KitchenOrderResource($kitchenOrder))->response();
    }

    public function accept(Request $request, Shop $shop, KitchenOrder $kitchenOrder): JsonResponse
    {
        $this->authorize('updateStatus', $kitchenOrder);

        $order = $this->kitchenOrderService->acceptOrder($kitchenOrder);

        return (new KitchenOrderResource($order))->response();
    }

    public function reject(RejectKitchenOrderRequest $request, Shop $shop, KitchenOrder $kitchenOrder): JsonResponse
    {
        $this->authorize('updateStatus', $kitchenOrder);

        $order = $this->kitchenOrderService->rejectOrder($kitchenOrder, $request->validated('reason'));

        return (new KitchenOrderResource($order))->response();
    }

    public function complete(Request $request, Shop $shop, KitchenOrder $kitchenOrder): JsonResponse
    {
        $this->authorize('updateStatus', $kitchenOrder);

        $order = $this->kitchenOrderService->completeOrder($kitchenOrder);

        return (new KitchenOrderResource($order))->response();
    }

    public function serve(Request $request, Shop $shop, KitchenOrder $kitchenOrder): JsonResponse
    {
        $this->authorize('updateStatus', $kitchenOrder);

        $order = $this->kitchenOrderService->serveOrder($kitchenOrder);

        return (new KitchenOrderResource($order))->response();
    }

    public function returnOrder(ReturnKitchenOrderRequest $request, Shop $shop, KitchenOrder $kitchenOrder): JsonResponse
    {
        $this->authorize('updateStatus', $kitchenOrder);

        $order = $this->kitchenOrderService->returnOrder($kitchenOrder, $request->validated('reason'));

        return (new KitchenOrderResource($order))->response();
    }

    public function cancel(Request $request, Shop $shop, KitchenOrder $kitchenOrder): JsonResponse
    {
        $this->authorize('updateStatus', $kitchenOrder);

        $order = $this->kitchenOrderService->cancelOrder($kitchenOrder, $request->user());

        return (new KitchenOrderResource($order))->response();
    }

    public function serveItem(Request $request, Shop $shop, KitchenOrder $kitchenOrder, KitchenOrderItem $item): JsonResponse
    {
        $this->authorize('serveItem', $kitchenOrder);

        $item = $this->kitchenOrderService->serveItem($item);

        return response()->json([
            'data' => [
                'id' => $item->id,
                'order_id' => $item->order_id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'notes' => $item->notes,
                'status' => $item->status,
                'served_at' => $item->served_at,
            ],
        ]);
    }
}
