<?php

namespace App\Http\Controllers;

use App\Http\Requests\Till\RecordTillPaymentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\KitchenOrder;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Till;
use ShopChain\Core\Models\TillPayment;
use ShopChain\Core\Resources\TillPaymentResource;
use ShopChain\Core\Services\TillPaymentService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TillPaymentController extends Controller
{
    public function __construct(private TillPaymentService $tillPaymentService) {}

    public function index(Request $request, Shop $shop, Till $till): JsonResponse
    {
        $this->authorize('view', $till);

        $payments = QueryBuilder::for(TillPayment::where('till_id', $till->id))
            ->allowedFilters([
                AllowedFilter::exact('method'),
                AllowedFilter::exact('order_id'),
            ])
            ->allowedSorts(['paid_at', 'amount'])
            ->allowedIncludes(['order'])
            ->defaultSort('-paid_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return TillPaymentResource::collection($payments)->response();
    }

    public function store(RecordTillPaymentRequest $request, Shop $shop, Till $till): JsonResponse
    {
        $this->authorize('recordPayment', $till);

        $order = KitchenOrder::findOrFail($request->validated('order_id'));

        $payment = $this->tillPaymentService->recordPayment(
            $till,
            $order,
            $request->validated(),
        );

        return (new TillPaymentResource($payment))
            ->response()
            ->setStatusCode(201);
    }
}
