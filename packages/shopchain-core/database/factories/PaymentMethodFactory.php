<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\PayType;
use ShopChain\Core\Models\PaymentMethod;

/**
 * @extends Factory<PaymentMethod>
 */
class PaymentMethodFactory extends Factory
{
    protected $model = PaymentMethod::class;

    public function definition(): array
    {
        return [
            'user_id' => null,
            'type' => PayType::Card,
            'provider' => 'visa',
            'last4' => fake()->numerify('####'),
            'display_name' => fake()->words(2, true),
            'is_default' => true,
            'expiry' => null,
            'status' => 'active',
            'added_at' => now(),
        ];
    }

    public function momo(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => PayType::Momo,
            'provider' => 'mtn',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
