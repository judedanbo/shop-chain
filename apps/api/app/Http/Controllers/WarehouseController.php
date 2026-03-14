<?php

namespace App\Http\Controllers;

use App\Http\Requests\Warehouse\CreateWarehouseRequest;
use App\Http\Requests\Warehouse\UpdateWarehouseRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Warehouse;
use ShopChain\Core\Resources\WarehouseResource;
use ShopChain\Core\Services\WarehouseService;

class WarehouseController extends Controller
{
    public function __construct(private WarehouseService $warehouseService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Warehouse::class);

        $warehouses = $shop->warehouses()
            ->withCount('productLocations')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return WarehouseResource::collection($warehouses)->response();
    }

    public function store(CreateWarehouseRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', Warehouse::class);

        $warehouse = $this->warehouseService->createWarehouse($shop, $request->validated());

        return (new WarehouseResource($warehouse))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, Warehouse $warehouse): JsonResponse
    {
        $this->authorize('view', $warehouse);

        $warehouse->loadCount('productLocations');

        return (new WarehouseResource($warehouse))->response();
    }

    public function update(UpdateWarehouseRequest $request, Shop $shop, Warehouse $warehouse): JsonResponse
    {
        $this->authorize('update', $warehouse);

        $warehouse = $this->warehouseService->updateWarehouse($warehouse, $request->validated());

        return (new WarehouseResource($warehouse))->response();
    }

    public function destroy(Request $request, Shop $shop, Warehouse $warehouse): JsonResponse
    {
        $this->authorize('delete', $warehouse);

        $this->warehouseService->deleteWarehouse($warehouse);

        return response()->json(null, 204);
    }
}
