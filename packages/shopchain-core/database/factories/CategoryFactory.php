<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\CategoryStatus;
use ShopChain\Core\Models\Category;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'name' => fake()->word(),
            'status' => CategoryStatus::Active,
            'sort_order' => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CategoryStatus::Inactive,
        ]);
    }
}
