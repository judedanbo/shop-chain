<?php

namespace App\Http\Controllers;

use App\Http\Requests\Supplier\CreateSupplierRequest;
use App\Http\Requests\Supplier\LinkSupplierProductRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Supplier;
use ShopChain\Core\Resources\SupplierProductResource;
use ShopChain\Core\Resources\SupplierResource;
use ShopChain\Core\Services\SupplierService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SupplierController extends Controller
{
    public function __construct(private SupplierService $supplierService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Supplier::class);

        $suppliers = QueryBuilder::for(Supplier::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::partial('name'),
            ])
            ->allowedSorts(['name', 'created_at', 'rating'])
            ->defaultSort('name')
            ->withCount(['products', 'purchaseOrders'])
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return SupplierResource::collection($suppliers)->response();
    }

    public function store(CreateSupplierRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', Supplier::class);

        $supplier = $this->supplierService->createSupplier($shop, $request->validated());

        return (new SupplierResource($supplier))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, Supplier $supplier): JsonResponse
    {
        $this->authorize('view', $supplier);

        $supplier->loadCount(['products', 'purchaseOrders']);

        return (new SupplierResource($supplier))->response();
    }

    public function update(UpdateSupplierRequest $request, Shop $shop, Supplier $supplier): JsonResponse
    {
        $this->authorize('update', $supplier);

        $supplier = $this->supplierService->updateSupplier($supplier, $request->validated());

        return (new SupplierResource($supplier))->response();
    }

    public function destroy(Request $request, Shop $shop, Supplier $supplier): JsonResponse
    {
        $this->authorize('delete', $supplier);

        $this->supplierService->deleteSupplier($supplier);

        return response()->json(null, 204);
    }

    public function products(Request $request, Shop $shop, Supplier $supplier): JsonResponse
    {
        $this->authorize('view', $supplier);

        $products = $supplier->products()
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return SupplierProductResource::collection($products)->response();
    }

    public function linkProduct(LinkSupplierProductRequest $request, Shop $shop, Supplier $supplier): JsonResponse
    {
        $this->authorize('update', $supplier);

        $this->supplierService->linkProduct($supplier, $request->validated());

        return response()->json(['message' => 'Product linked successfully.']);
    }

    public function unlinkProduct(Request $request, Shop $shop, Supplier $supplier, Product $product): JsonResponse
    {
        $this->authorize('update', $supplier);

        $this->supplierService->unlinkProduct($supplier, $product->id);

        return response()->json(null, 204);
    }
}
