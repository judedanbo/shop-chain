<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Subscription;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    protected $model = Subscription::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'plan_id' => null,
            'status' => SubscriptionStatus::Active,
            'started_at' => now(),
            'expires_at' => now()->addDays(30),
            'cancelled_at' => null,
            'auto_renew' => true,
        ];
    }

    public function trial(): static
    {
        return $this->state(fn (array $attributes) => [
            'started_at' => now(),
            'expires_at' => now()->addDays(14),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SubscriptionStatus::Expired,
            'expires_at' => now()->subDay(),
        ]);
    }

    public function pastDue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SubscriptionStatus::PastDue,
        ]);
    }
}
