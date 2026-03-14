<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\WarehouseStatus;
use ShopChain\Core\Enums\WarehouseType;
use ShopChain\Core\Models\Warehouse;

/**
 * @extends Factory<Warehouse>
 */
class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'name' => fake()->words(2, true).' Warehouse',
            'type' => WarehouseType::MainStorage,
            'status' => WarehouseStatus::Active,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WarehouseStatus::Inactive,
        ]);
    }

    public function secondary(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => WarehouseType::Secondary,
        ]);
    }
}
