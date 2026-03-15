<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\ExemptionUnit;
use ShopChain\Core\Models\BillingExemption;

/**
 * @extends Factory<BillingExemption>
 */
class BillingExemptionFactory extends Factory
{
    protected $model = BillingExemption::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'granted_by' => null,
            'period' => 1,
            'unit' => ExemptionUnit::Months,
            'unlimited' => false,
            'reason' => 'Promotional',
            'starts_at' => now(),
            'expires_at' => now()->addMonth(),
        ];
    }

    public function unlimited(): static
    {
        return $this->state(fn (array $attributes) => [
            'unlimited' => true,
            'period' => 0,
            'expires_at' => null,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDay(),
        ]);
    }
}
