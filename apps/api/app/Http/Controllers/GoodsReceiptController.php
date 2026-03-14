<?php

namespace App\Http\Controllers;

use App\Http\Requests\GoodsReceipt\CreateGoodsReceiptRequest;
use App\Http\Requests\GoodsReceipt\UpdateGoodsReceiptRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\GoodsReceipt;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\GoodsReceiptResource;
use ShopChain\Core\Services\GoodsReceiptService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class GoodsReceiptController extends Controller
{
    public function __construct(private GoodsReceiptService $receiptService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', GoodsReceipt::class);

        $receipts = QueryBuilder::for(GoodsReceipt::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('warehouse_id'),
            ])
            ->allowedSorts(['receipt_date', 'created_at', 'reference', 'status'])
            ->allowedIncludes(['warehouse', 'creator', 'items'])
            ->withCount('items')
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return GoodsReceiptResource::collection($receipts)->response();
    }

    public function store(CreateGoodsReceiptRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', GoodsReceipt::class);

        $receipt = $this->receiptService->createReceipt(
            $shop,
            $request->validated(),
            $request->user(),
        );

        return (new GoodsReceiptResource($receipt))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, GoodsReceipt $receipt): JsonResponse
    {
        $this->authorize('view', $receipt);

        $receipt->load(['warehouse', 'creator', 'items.product'])->loadCount('items');

        return (new GoodsReceiptResource($receipt))->response();
    }

    public function update(UpdateGoodsReceiptRequest $request, Shop $shop, GoodsReceipt $receipt): JsonResponse
    {
        $this->authorize('update', $receipt);

        if ($request->validated('action') === 'complete') {
            $receipt = $this->receiptService->completeReceipt($receipt);
        } else {
            $receipt->update($request->safe()->except('action'));
            $receipt = $receipt->fresh();
        }

        $receipt->load(['warehouse', 'creator', 'items.product'])->loadCount('items');

        return (new GoodsReceiptResource($receipt))->response();
    }
}
