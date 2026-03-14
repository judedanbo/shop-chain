<?php

namespace App\Http\Controllers;

use App\Http\Requests\Sale\CreateSaleRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\SaleResource;
use ShopChain\Core\Services\SaleService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SaleController extends Controller
{
    public function __construct(private SaleService $saleService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Sale::class);

        $sales = QueryBuilder::for(Sale::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('cashier_id'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::callback('date_from', fn ($query, $value) => $query->where('created_at', '>=', $value)),
                AllowedFilter::callback('date_to', fn ($query, $value) => $query->where('created_at', '<=', $value)),
            ])
            ->allowedSorts(['created_at', 'total'])
            ->allowedIncludes(['customer', 'branch', 'cashier'])
            ->withCount('items')
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return SaleResource::collection($sales)->response();
    }

    public function store(CreateSaleRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $sale = $this->saleService->createSale(
            $shop,
            $request->validated(),
            $request->user(),
        );

        return (new SaleResource($sale))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, Sale $sale): JsonResponse
    {
        $this->authorize('view', $sale);

        $sale->load(['items.product', 'payments', 'customer', 'branch', 'cashier'])
            ->loadCount('items');

        return (new SaleResource($sale))->response();
    }
}
