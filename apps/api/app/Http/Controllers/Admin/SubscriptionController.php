<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Subscription;
use ShopChain\Core\Resources\SubscriptionResource;
use ShopChain\Core\Services\SubscriptionService;

class SubscriptionController extends Controller
{
    public function __construct(private SubscriptionService $subscriptionService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Subscription::withoutGlobalScopes()->with(['plan', 'shop']);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('plan_id')) {
            $query->where('plan_id', $request->input('plan_id'));
        }

        $subscriptions = $query->latest()->paginate($request->integer('per_page', 15));

        return SubscriptionResource::collection($subscriptions)->response();
    }

    public function show(Subscription $subscription): JsonResponse
    {
        $subscription->load(['plan', 'shop', 'billingRecords']);

        return (new SubscriptionResource($subscription))->response();
    }

    public function changePlan(Request $request, Subscription $subscription): JsonResponse
    {
        $request->validate(['plan_id' => ['required', 'string', 'exists:plans,id']]);

        $subscription = $this->subscriptionService->changePlan(
            $subscription,
            $request->input('plan_id'),
        );

        return (new SubscriptionResource($subscription))->response();
    }

    public function cancel(Request $request, Subscription $subscription): JsonResponse
    {
        $subscription = $this->subscriptionService->cancel($subscription);

        return (new SubscriptionResource($subscription))->response();
    }
}
