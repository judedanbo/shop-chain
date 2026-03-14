<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\BranchStatus;
use ShopChain\Core\Enums\BranchType;
use ShopChain\Core\Models\Branch;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    protected $model = Branch::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'name' => fake()->words(2, true).' Branch',
            'type' => BranchType::Retail,
            'is_default' => false,
            'status' => BranchStatus::Active,
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BranchStatus::Inactive,
        ]);
    }
}
