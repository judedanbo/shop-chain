<?php

namespace App\Http\Controllers;

use App\Http\Requests\Transfer\CreateTransferRequest;
use App\Http\Requests\Transfer\UpdateTransferRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\StockTransfer;
use ShopChain\Core\Resources\StockTransferResource;
use ShopChain\Core\Services\StockTransferService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class StockTransferController extends Controller
{
    public function __construct(private StockTransferService $transferService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', StockTransfer::class);

        $transfers = QueryBuilder::for(StockTransfer::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('product_id'),
                AllowedFilter::exact('from_warehouse_id'),
                AllowedFilter::exact('to_warehouse_id'),
            ])
            ->allowedSorts(['created_at', 'quantity', 'status', 'shipped_at', 'received_at'])
            ->allowedIncludes(['product', 'fromWarehouse', 'toWarehouse', 'fromBranch', 'toBranch', 'creator'])
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return StockTransferResource::collection($transfers)->response();
    }

    public function store(CreateTransferRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', StockTransfer::class);

        $transfer = $this->transferService->createTransfer(
            $shop,
            $request->validated(),
            $request->user(),
        );

        return (new StockTransferResource($transfer))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, StockTransfer $transfer): JsonResponse
    {
        $this->authorize('view', $transfer);

        $transfer->load(['product', 'fromWarehouse', 'toWarehouse', 'fromBranch', 'toBranch', 'creator']);

        return (new StockTransferResource($transfer))->response();
    }

    public function update(UpdateTransferRequest $request, Shop $shop, StockTransfer $transfer): JsonResponse
    {
        $this->authorize('update', $transfer);

        $transfer = match ($request->validated('action')) {
            'ship' => $this->transferService->shipTransfer($transfer),
            'complete' => $this->transferService->completeTransfer($transfer),
            'cancel' => $this->transferService->cancelTransfer($transfer),
        };

        return (new StockTransferResource($transfer))->response();
    }
}
