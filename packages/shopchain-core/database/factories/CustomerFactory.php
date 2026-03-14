<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\CustomerType;
use ShopChain\Core\Models\Customer;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'name' => fake()->name(),
            'phone' => fake()->unique()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'type' => CustomerType::Regular,
            'total_spent' => 0,
            'visits' => 0,
            'loyalty_pts' => 0,
        ];
    }

    public function wholesale(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => CustomerType::Wholesale,
        ]);
    }

    public function walkIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => CustomerType::WalkIn,
        ]);
    }
}
