<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\ProductStatus;
use ShopChain\Core\Models\Product;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'sku' => fake()->unique()->bothify('SKU-####'),
            'name' => fake()->words(3, true),
            'price' => fake()->randomFloat(2, 1, 1000),
            'cost' => fake()->randomFloat(2, 0.5, 500),
            'status' => ProductStatus::InStock,
            'reorder_level' => 10,
            'batch_tracking' => false,
        ];
    }

    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProductStatus::LowStock,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProductStatus::OutOfStock,
        ]);
    }

    public function batchTracked(): static
    {
        return $this->state(fn (array $attributes) => [
            'batch_tracking' => true,
        ]);
    }
}
