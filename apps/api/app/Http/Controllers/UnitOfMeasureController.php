<?php

namespace App\Http\Controllers;

use App\Http\Requests\Unit\CreateUnitRequest;
use App\Http\Requests\Unit\UpdateUnitRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\UnitOfMeasure;
use ShopChain\Core\Resources\UnitOfMeasureResource;
use ShopChain\Core\Services\UnitOfMeasureService;

class UnitOfMeasureController extends Controller
{
    public function __construct(private UnitOfMeasureService $unitService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', UnitOfMeasure::class);

        $units = UnitOfMeasure::query()
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return UnitOfMeasureResource::collection($units)->response();
    }

    public function store(CreateUnitRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', UnitOfMeasure::class);

        $unit = $this->unitService->createUnit($shop, $request->validated());

        return (new UnitOfMeasureResource($unit))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, UnitOfMeasure $unit): JsonResponse
    {
        $this->authorize('view', $unit);

        $unit->loadCount('products');

        return (new UnitOfMeasureResource($unit))->response();
    }

    public function update(UpdateUnitRequest $request, Shop $shop, UnitOfMeasure $unit): JsonResponse
    {
        $this->authorize('update', $unit);

        $unit = $this->unitService->updateUnit($unit, $request->validated());

        return (new UnitOfMeasureResource($unit))->response();
    }

    public function destroy(Request $request, Shop $shop, UnitOfMeasure $unit): JsonResponse
    {
        $this->authorize('delete', $unit);

        $this->unitService->deleteUnit($unit);

        return response()->json(null, 204);
    }
}
