<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePlanRequest;
use App\Http\Requests\Admin\TransitionPlanRequest;
use App\Http\Requests\Admin\UpdatePlanRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Enums\PlanLifecycle;
use ShopChain\Core\Models\Plan;
use ShopChain\Core\Resources\PlanResource;
use ShopChain\Core\Services\PlanService;

class PlanController extends Controller
{
    public function __construct(private PlanService $planService) {}

    public function index(): JsonResponse
    {
        $plans = Plan::withCount('subscriptions')->get();

        return PlanResource::collection($plans)->response();
    }

    public function store(StorePlanRequest $request): JsonResponse
    {
        $plan = $this->planService->create($request->validated());

        return (new PlanResource($plan))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Plan $plan): JsonResponse
    {
        $plan->loadCount('subscriptions');

        return (new PlanResource($plan))->response();
    }

    public function update(UpdatePlanRequest $request, Plan $plan): JsonResponse
    {
        $plan = $this->planService->update($plan, $request->validated());

        return (new PlanResource($plan))->response();
    }

    public function transition(TransitionPlanRequest $request, Plan $plan): JsonResponse
    {
        $lifecycle = PlanLifecycle::from($request->validated('lifecycle'));

        if ($lifecycle === PlanLifecycle::Retired && $request->validated('fallback_id')) {
            $plan = $this->planService->retire($plan, $request->validated('fallback_id'));
        } else {
            $plan = $this->planService->transitionLifecycle($plan, $lifecycle);
        }

        return (new PlanResource($plan))->response();
    }
}
