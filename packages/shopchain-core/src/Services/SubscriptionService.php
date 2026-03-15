<?php

namespace ShopChain\Core\Services;

use Illuminate\Support\Str;
use ShopChain\Core\Enums\BillingStatus;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\BillingRecord;
use ShopChain\Core\Models\Plan;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Subscription;

class SubscriptionService
{
    /**
     * Get current plan info for a shop.
     *
     * @return array{plan: Plan, subscription: ?Subscription, usage: array, is_trial: bool, days_remaining: int}
     */
    public function getCurrentPlan(Shop $shop): array
    {
        $subscription = $shop->activeSubscription;
        $plan = $shop->activePlan;

        $isTrial = false;
        $daysRemaining = 0;

        if ($subscription) {
            $trialDays = config('shopchain.billing.trial_days', 14);
            $isTrial = $subscription->billingRecords()->count() === 0
                && $subscription->started_at->diffInDays($subscription->expires_at) <= $trialDays;

            $daysRemaining = (int) max(0, now()->diffInDays($subscription->expires_at, false));
        }

        return [
            'plan' => $plan,
            'subscription' => $subscription,
            'is_trial' => $isTrial,
            'days_remaining' => $daysRemaining,
        ];
    }

    /**
     * Start a trial subscription for a shop.
     */
    public function startTrial(Shop $shop, string $planId = 'basic'): Subscription
    {
        $this->ensureNoActiveSubscription($shop);

        $trialDays = config('shopchain.billing.trial_days', 14);

        return Subscription::create([
            'shop_id' => $shop->id,
            'plan_id' => $planId,
            'status' => SubscriptionStatus::Active,
            'started_at' => now(),
            'expires_at' => now()->addDays($trialDays),
            'auto_renew' => false,
        ]);
    }

    /**
     * Subscribe a shop to a plan (new subscription or upgrade from free).
     */
    public function subscribe(Shop $shop, string $planId, ?string $paymentMethodId = null): Subscription
    {
        $plan = Plan::findOrFail($planId);
        $existing = $shop->activeSubscription;

        if ($existing) {
            return $this->changePlan($existing, $planId, $paymentMethodId);
        }

        $subscription = Subscription::create([
            'shop_id' => $shop->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'started_at' => now(),
            'expires_at' => now()->addDays(30),
            'auto_renew' => true,
        ]);

        if ($plan->price > 0) {
            BillingRecord::create([
                'shop_id' => $shop->id,
                'subscription_id' => $subscription->id,
                'amount' => $plan->price,
                'method_id' => $paymentMethodId,
                'status' => BillingStatus::Pending,
                'tx_ref' => 'sub_' . Str::random(20),
                'note' => "Subscription to {$plan->name} plan",
            ]);
        }

        return $subscription->load('plan');
    }

    /**
     * Change plan — upgrade (immediate) or downgrade (end of period).
     */
    public function changePlan(Subscription $subscription, string $newPlanId, ?string $paymentMethodId = null): Subscription
    {
        if ($subscription->plan_id === $newPlanId) {
            throw new \InvalidArgumentException('Already subscribed to this plan.');
        }

        $newPlan = Plan::findOrFail($newPlanId);
        $currentPlan = $subscription->plan;
        $isUpgrade = $newPlan->price > $currentPlan->price;

        if ($isUpgrade) {
            $proration = $this->calculateProration($subscription, $newPlan);

            $subscription->update([
                'plan_id' => $newPlan->id,
                'expires_at' => now()->addDays(30),
            ]);

            if ($proration['net_amount'] > 0) {
                BillingRecord::create([
                    'shop_id' => $subscription->shop_id,
                    'subscription_id' => $subscription->id,
                    'amount' => $proration['net_amount'],
                    'method_id' => $paymentMethodId,
                    'status' => BillingStatus::Pending,
                    'tx_ref' => 'upg_' . Str::random(20),
                    'note' => "Upgrade from {$currentPlan->name} to {$newPlan->name}",
                ]);
            }
        } else {
            // Downgrade at end of current period
            $subscription->update([
                'plan_id' => $newPlan->id,
            ]);
        }

        return $subscription->refresh()->load('plan');
    }

    /**
     * Calculate proration for plan change.
     *
     * @return array{credit: float, charge: float, net_amount: float}
     */
    public function calculateProration(Subscription $subscription, Plan $newPlan): array
    {
        $currentPlan = $subscription->plan;
        $totalDays = max(1, $subscription->started_at->diffInDays($subscription->expires_at));
        $remainingDays = max(0, now()->diffInDays($subscription->expires_at, false));

        $credit = ($remainingDays / $totalDays) * (float) $currentPlan->price;
        $charge = (float) $newPlan->price;
        $netAmount = max(0, $charge - $credit);

        return [
            'credit' => round($credit, 2),
            'charge' => round($charge, 2),
            'net_amount' => round($netAmount, 2),
        ];
    }

    /**
     * Cancel a subscription — sets cancelled_at, keeps access until expires_at.
     */
    public function cancel(Subscription $subscription): Subscription
    {
        $subscription->update([
            'cancelled_at' => now(),
            'auto_renew' => false,
        ]);

        return $subscription->refresh();
    }

    /**
     * Renew a subscription — extends expires_at and creates billing record.
     */
    public function renew(Subscription $subscription): Subscription
    {
        $plan = $subscription->plan;

        $subscription->update([
            'expires_at' => $subscription->expires_at->addDays(30),
            'status' => SubscriptionStatus::Active,
        ]);

        if ($plan->price > 0) {
            BillingRecord::create([
                'shop_id' => $subscription->shop_id,
                'subscription_id' => $subscription->id,
                'amount' => $plan->price,
                'status' => BillingStatus::Pending,
                'tx_ref' => 'ren_' . Str::random(20),
                'note' => "Renewal of {$plan->name} plan",
            ]);
        }

        return $subscription->refresh();
    }

    /**
     * Expire a subscription — status becomes Expired (shop falls back to free via accessor).
     */
    public function expire(Subscription $subscription): Subscription
    {
        $subscription->update([
            'status' => SubscriptionStatus::Expired,
        ]);

        return $subscription->refresh();
    }

    /**
     * Handle successful payment — mark billing record as Paid, restore Active if PastDue.
     */
    public function handlePaymentSuccess(string $txRef): BillingRecord
    {
        $record = BillingRecord::where('tx_ref', $txRef)->firstOrFail();
        $record->update(['status' => BillingStatus::Paid]);

        $subscription = $record->subscription;

        if ($subscription && $subscription->status === SubscriptionStatus::PastDue) {
            $subscription->update(['status' => SubscriptionStatus::Active]);
        }

        return $record->refresh();
    }

    /**
     * Handle failed payment — mark billing record as Failed, set subscription PastDue.
     */
    public function handlePaymentFailure(string $txRef): BillingRecord
    {
        $record = BillingRecord::where('tx_ref', $txRef)->firstOrFail();
        $record->update(['status' => BillingStatus::Failed]);

        $subscription = $record->subscription;

        if ($subscription && $subscription->status === SubscriptionStatus::Active) {
            $subscription->update(['status' => SubscriptionStatus::PastDue]);
        }

        return $record->refresh();
    }

    private function ensureNoActiveSubscription(Shop $shop): void
    {
        if ($shop->activeSubscription) {
            throw new \InvalidArgumentException('Shop already has an active subscription.');
        }
    }
}
