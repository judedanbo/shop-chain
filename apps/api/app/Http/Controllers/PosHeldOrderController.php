<?php

namespace App\Http\Controllers;

use App\Http\Requests\PosHeldOrder\CreatePosHeldOrderRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use ShopChain\Core\Models\PosHeldOrder;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\PosHeldOrderResource;

class PosHeldOrderController extends Controller
{
    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', PosHeldOrder::class);

        $orders = PosHeldOrder::query()
            ->when($request->input('filter.branch_id'), fn ($q, $branchId) => $q->where('branch_id', $branchId))
            ->with(['items.product', 'heldBy'])
            ->orderByDesc('held_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return PosHeldOrderResource::collection($orders)->response();
    }

    public function store(CreatePosHeldOrderRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', PosHeldOrder::class);

        $data = $request->validated();

        $order = DB::transaction(function () use ($shop, $data, $request) {
            $order = PosHeldOrder::create([
                'shop_id' => $shop->id,
                'branch_id' => $data['branch_id'],
                'held_by' => $request->user()->id,
                'discount_value' => $data['discount_value'] ?? null,
                'discount_type' => $data['discount_type'] ?? null,
                'held_at' => now(),
            ]);

            foreach ($data['items'] as $item) {
                $order->items()->create($item);
            }

            return $order->load(['items.product', 'heldBy']);
        });

        return (new PosHeldOrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, PosHeldOrder $posHeldOrder): JsonResponse
    {
        $this->authorize('view', $posHeldOrder);

        $posHeldOrder->load(['items.product', 'heldBy']);

        return (new PosHeldOrderResource($posHeldOrder))->response();
    }

    public function recall(Request $request, Shop $shop, PosHeldOrder $posHeldOrder): JsonResponse
    {
        $this->authorize('delete', $posHeldOrder);

        $posHeldOrder->load(['items.product', 'heldBy']);

        $resource = new PosHeldOrderResource($posHeldOrder);
        $response = $resource->response();

        $posHeldOrder->items()->delete();
        $posHeldOrder->delete();

        return $response;
    }

    public function destroy(Request $request, Shop $shop, PosHeldOrder $posHeldOrder): JsonResponse
    {
        $this->authorize('delete', $posHeldOrder);

        $posHeldOrder->items()->delete();
        $posHeldOrder->delete();

        return response()->json(null, 204);
    }
}
