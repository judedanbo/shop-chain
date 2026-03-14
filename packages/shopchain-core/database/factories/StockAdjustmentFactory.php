<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\AdjustmentStatus;
use ShopChain\Core\Enums\AdjustmentType;
use ShopChain\Core\Models\StockAdjustment;

/**
 * @extends Factory<StockAdjustment>
 */
class StockAdjustmentFactory extends Factory
{
    protected $model = StockAdjustment::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'product_id' => null,
            'type' => AdjustmentType::Recount,
            'quantity_change' => fake()->numberBetween(-50, 50),
            'adjustment_date' => now(),
            'reason' => fake()->sentence(),
            'status' => AdjustmentStatus::Pending,
            'created_by' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AdjustmentStatus::Approved,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AdjustmentStatus::Rejected,
        ]);
    }

    public function damage(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => AdjustmentType::Damage,
        ]);
    }

    public function theft(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => AdjustmentType::Theft,
        ]);
    }
}
