<?php

namespace ShopChain\Core\Services;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use ShopChain\Core\Enums\PlanLifecycle;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Plan;
use ShopChain\Core\Models\Subscription;

class PlanService
{
    /**
     * List plans — admin sees all, users see active + scheduled only.
     */
    public function list(bool $adminView = false): Collection
    {
        if ($adminView) {
            return Plan::all();
        }

        return Plan::whereIn('lifecycle', [PlanLifecycle::Active, PlanLifecycle::Scheduled])->get();
    }

    public function get(string $planId): Plan
    {
        return Plan::findOrFail($planId);
    }

    public function create(array $data): Plan
    {
        $data['lifecycle'] = PlanLifecycle::Draft;

        return Plan::create($data);
    }

    public function update(Plan $plan, array $data): Plan
    {
        if ($plan->lifecycle === PlanLifecycle::Retired) {
            throw new \InvalidArgumentException('Cannot modify a retired plan.');
        }

        $plan->update($data);

        return $plan->refresh();
    }

    /**
     * Transition plan lifecycle. Allowed transitions:
     * Draft → Scheduled → Active → Retiring → Retired
     */
    public function transitionLifecycle(Plan $plan, PlanLifecycle $target): Plan
    {
        $allowed = [
            PlanLifecycle::Draft->value => [PlanLifecycle::Scheduled, PlanLifecycle::Active],
            PlanLifecycle::Scheduled->value => [PlanLifecycle::Active],
            PlanLifecycle::Active->value => [PlanLifecycle::Retiring],
            PlanLifecycle::Retiring->value => [PlanLifecycle::Retired],
        ];

        $transitions = $allowed[$plan->lifecycle->value] ?? [];

        if (! in_array($target, $transitions)) {
            throw new \InvalidArgumentException(
                "Cannot transition from {$plan->lifecycle->value} to {$target->value}."
            );
        }

        $updates = ['lifecycle' => $target];

        if ($target === PlanLifecycle::Active && ! $plan->available_from) {
            $updates['available_from'] = now();
        }

        if ($target === PlanLifecycle::Retiring) {
            $updates['retire_at'] = $plan->retire_at ?? now()->addDays(30);
        }

        $plan->update($updates);

        return $plan->refresh();
    }

    /**
     * Retire a plan and optionally migrate subscribers to a fallback plan.
     */
    public function retire(Plan $plan, ?string $fallbackId = null): Plan
    {
        if ($fallbackId) {
            $fallback = $this->get($fallbackId);
            $plan->update(['fallback_id' => $fallback->id]);
            $this->migrateSubscribers($plan, $fallback);
        }

        return $this->transitionLifecycle($plan, PlanLifecycle::Retired);
    }

    /**
     * Migrate all active subscribers from one plan to another.
     */
    public function migrateSubscribers(Plan $from, Plan $to): int
    {
        return Subscription::where('plan_id', $from->id)
            ->where('status', SubscriptionStatus::Active)
            ->update(['plan_id' => $to->id]);
    }
}
