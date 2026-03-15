<?php

namespace App\Http\Controllers;

use App\Http\Requests\Billing\AddPaymentMethodRequest;
use App\Http\Requests\Billing\UpgradePlanRequest;
use App\Services\PlanEnforcementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\PaymentMethod;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\BillingRecordResource;
use ShopChain\Core\Resources\PaymentMethodResource;
use ShopChain\Core\Resources\PlanResource;
use ShopChain\Core\Resources\SubscriptionResource;
use ShopChain\Core\Services\PaymentMethodService;
use ShopChain\Core\Services\SubscriptionService;

class BillingController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService,
        private PaymentMethodService $paymentMethodService,
    ) {}

    public function plan(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('manageBilling', $shop);

        $current = $this->subscriptionService->getCurrentPlan($shop);
        $usage = app(PlanEnforcementService::class)->computeUsage($shop);

        return response()->json([
            'plan' => new PlanResource($current['plan']),
            'subscription' => $current['subscription']
                ? new SubscriptionResource($current['subscription']->load('plan'))
                : null,
            'usage' => $usage,
            'is_trial' => $current['is_trial'],
            'days_remaining' => $current['days_remaining'],
        ]);
    }

    public function upgrade(UpgradePlanRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('manageBilling', $shop);

        $subscription = $this->subscriptionService->subscribe(
            $shop,
            $request->validated('plan_id'),
            $request->validated('payment_method_id'),
        );

        return (new SubscriptionResource($subscription->load('plan')))
            ->response()
            ->setStatusCode(201);
    }

    public function cancel(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('manageBilling', $shop);

        $subscription = $shop->activeSubscription;

        if (! $subscription) {
            return response()->json(['message' => 'No active subscription to cancel.'], 422);
        }

        $subscription = $this->subscriptionService->cancel($subscription);

        return (new SubscriptionResource($subscription->load('plan')))->response();
    }

    public function history(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('manageBilling', $shop);

        $records = $shop->billingRecords()
            ->with('paymentMethod')
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return BillingRecordResource::collection($records)->response();
    }

    public function paymentMethods(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('manageBilling', $shop);

        $methods = $this->paymentMethodService->listForUser($request->user());

        return PaymentMethodResource::collection($methods)->response();
    }

    public function addPaymentMethod(AddPaymentMethodRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('manageBilling', $shop);

        $method = $this->paymentMethodService->add(
            $request->user(),
            $request->validated(),
        );

        return (new PaymentMethodResource($method))
            ->response()
            ->setStatusCode(201);
    }

    public function setDefaultPaymentMethod(Request $request, Shop $shop, PaymentMethod $paymentMethod): JsonResponse
    {
        $this->authorize('manageBilling', $shop);

        $method = $this->paymentMethodService->setDefault($paymentMethod, $request->user());

        return (new PaymentMethodResource($method))->response();
    }

    public function removePaymentMethod(Request $request, Shop $shop, PaymentMethod $paymentMethod): JsonResponse
    {
        $this->authorize('manageBilling', $shop);

        $this->paymentMethodService->remove($paymentMethod, $request->user());

        return response()->json(null, 204);
    }
}
