<?php

namespace App\Http\Controllers;

use App\Http\Requests\Batch\CreateBatchRequest;
use App\Http\Requests\Batch\UpdateBatchRequest;
use App\Http\Requests\Product\CreateProductRequest;
use App\Http\Requests\Product\UpdateProductPriceRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\BatchResource;
use ShopChain\Core\Resources\PriceHistoryResource;
use ShopChain\Core\Resources\ProductResource;
use ShopChain\Core\Services\ProductService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProductController extends Controller
{
    public function __construct(private ProductService $productService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $products = QueryBuilder::for(Product::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('category_id'),
                AllowedFilter::partial('name'),
                AllowedFilter::exact('sku'),
                AllowedFilter::exact('barcode'),
                AllowedFilter::exact('batch_tracking'),
            ])
            ->allowedSorts(['name', 'sku', 'price', 'cost', 'created_at', 'status'])
            ->allowedIncludes(['category', 'unit'])
            ->defaultSort('name')
            ->withCount('batches')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return ProductResource::collection($products)->response();
    }

    public function store(CreateProductRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', Product::class);

        $product = $this->productService->createProduct(
            $shop,
            $request->safe()->except(['image']),
            $request->file('image'),
        );

        return (new ProductResource($product))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $product->load(['category', 'unit'])->loadCount('batches');

        return (new ProductResource($product))->response();
    }

    public function update(UpdateProductRequest $request, Shop $shop, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $product = $this->productService->updateProduct(
            $product,
            $request->safe()->except(['image']),
            $request->file('image'),
        );

        return (new ProductResource($product))->response();
    }

    public function destroy(Request $request, Shop $shop, Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $this->productService->deleteProduct($product);

        return response()->json(null, 204);
    }

    public function updatePrice(UpdateProductPriceRequest $request, Shop $shop, Product $product): JsonResponse
    {
        $this->authorize('updatePrice', $product);

        $product = $this->productService->updatePrice($product, $request->validated(), $request->user());

        return (new ProductResource($product))->response();
    }

    public function priceHistory(Request $request, Shop $shop, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $history = $product->priceHistory()
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return PriceHistoryResource::collection($history)->response();
    }

    public function batches(Request $request, Shop $shop, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $batches = $product->batches()
            ->orderByRaw('expiry_date ASC NULLS LAST')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return BatchResource::collection($batches)->response();
    }

    public function storeBatch(CreateBatchRequest $request, Shop $shop, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $data = $request->validated();

        $batch = $product->batches()->create([
            ...$data,
            'shop_id' => $shop->id,
            'initial_quantity' => $data['quantity'],
        ]);

        return (new BatchResource($batch))
            ->response()
            ->setStatusCode(201);
    }

    public function updateBatch(UpdateBatchRequest $request, Shop $shop, Product $product, Batch $batch): JsonResponse
    {
        $this->authorize('update', $product);

        $batch->update($request->validated());

        return (new BatchResource($batch->fresh()))->response();
    }
}
