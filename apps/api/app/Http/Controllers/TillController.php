<?php

namespace App\Http\Controllers;

use App\Http\Requests\Till\CloseTillRequest;
use App\Http\Requests\Till\OpenTillRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Till;
use ShopChain\Core\Resources\TillResource;
use ShopChain\Core\Services\TillService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TillController extends Controller
{
    public function __construct(private TillService $tillService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Till::class);

        $tills = QueryBuilder::for(Till::class)
            ->allowedFilters([
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['opened_at', 'closed_at', 'name'])
            ->with(['branch', 'openedBy', 'closedBy'])
            ->withCount('sales')
            ->defaultSort('-opened_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return TillResource::collection($tills)->response();
    }

    public function show(Request $request, Shop $shop, Till $till): JsonResponse
    {
        $this->authorize('view', $till);

        $till->load(['branch', 'openedBy', 'closedBy'])->loadCount('sales');

        $summary = $this->tillService->getTillSummary($till);

        return (new TillResource($till))
            ->additional(['summary' => $summary])
            ->response();
    }

    public function open(OpenTillRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', Till::class);

        $till = $this->tillService->openTill(
            $shop,
            $request->validated(),
            $request->user(),
        );

        return (new TillResource($till))
            ->response()
            ->setStatusCode(201);
    }

    public function close(CloseTillRequest $request, Shop $shop, Till $till): JsonResponse
    {
        $this->authorize('close', $till);

        $till = $this->tillService->closeTill(
            $till,
            $request->validated(),
            $request->user(),
        );

        $summary = $this->tillService->getTillSummary($till);

        return (new TillResource($till))
            ->additional(['summary' => $summary])
            ->response();
    }
}
