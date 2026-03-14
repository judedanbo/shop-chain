<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\ShopStatus;
use ShopChain\Core\Enums\ShopType;
use ShopChain\Core\Models\Shop;

/**
 * @extends Factory<Shop>
 */
class ShopFactory extends Factory
{
    protected $model = Shop::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'type' => fake()->randomElement(ShopType::cases()),
            'owner_id' => null,
            'currency' => 'GHS',
            'timezone' => 'Africa/Accra',
            'status' => ShopStatus::Active,
        ];
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ShopStatus::Suspended,
        ]);
    }
}
