<?php

namespace App\Http\Controllers;

use App\Http\Requests\HeldOrder\CreateHeldOrderRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use ShopChain\Core\Models\HeldOrder;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\HeldOrderResource;

class HeldOrderController extends Controller
{
    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', HeldOrder::class);

        $orders = HeldOrder::query()
            ->when($request->input('filter.till_id'), fn ($q, $tillId) => $q->where('till_id', $tillId))
            ->with(['items.product', 'till'])
            ->orderByDesc('held_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return HeldOrderResource::collection($orders)->response();
    }

    public function store(CreateHeldOrderRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', HeldOrder::class);

        $data = $request->validated();

        $order = DB::transaction(function () use ($shop, $data) {
            $order = HeldOrder::create([
                'shop_id' => $shop->id,
                'till_id' => $data['till_id'],
                'table_number' => $data['table_number'] ?? null,
                'order_type' => $data['order_type'],
                'label' => $data['label'] ?? null,
                'held_at' => now(),
            ]);

            foreach ($data['items'] as $item) {
                $order->items()->create($item);
            }

            return $order->load(['items.product', 'till']);
        });

        return (new HeldOrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, HeldOrder $heldOrder): JsonResponse
    {
        $this->authorize('view', $heldOrder);

        $heldOrder->load(['items.product', 'till']);

        return (new HeldOrderResource($heldOrder))->response();
    }

    public function recall(Request $request, Shop $shop, HeldOrder $heldOrder): JsonResponse
    {
        $this->authorize('delete', $heldOrder);

        $heldOrder->load(['items.product', 'till']);

        $resource = new HeldOrderResource($heldOrder);
        $response = $resource->response();

        $heldOrder->items()->delete();
        $heldOrder->delete();

        return $response;
    }

    public function destroy(Request $request, Shop $shop, HeldOrder $heldOrder): JsonResponse
    {
        $this->authorize('delete', $heldOrder);

        $heldOrder->items()->delete();
        $heldOrder->delete();

        return response()->json(null, 204);
    }
}
