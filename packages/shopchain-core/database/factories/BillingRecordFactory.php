<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\BillingStatus;
use ShopChain\Core\Models\BillingRecord;

/**
 * @extends Factory<BillingRecord>
 */
class BillingRecordFactory extends Factory
{
    protected $model = BillingRecord::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'subscription_id' => null,
            'amount' => 4900,
            'method_id' => null,
            'status' => BillingStatus::Paid,
            'tx_ref' => fake()->unique()->bothify('TX-########-????'),
            'note' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BillingStatus::Pending,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BillingStatus::Failed,
        ]);
    }

    public function refunded(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BillingStatus::Refunded,
        ]);
    }
}
