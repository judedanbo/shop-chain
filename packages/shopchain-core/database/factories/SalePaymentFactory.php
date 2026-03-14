<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\PayMethod;
use ShopChain\Core\Models\SalePayment;

/**
 * @extends Factory<SalePayment>
 */
class SalePaymentFactory extends Factory
{
    protected $model = SalePayment::class;

    public function definition(): array
    {
        $amount = fake()->randomFloat(2, 10, 500);

        return [
            'sale_id' => null,
            'method' => PayMethod::Cash,
            'amount' => $amount,
            'amount_tendered' => $amount,
            'change_given' => 0,
        ];
    }

    public function card(): static
    {
        return $this->state(fn (array $attributes) => [
            'method' => PayMethod::Card,
        ]);
    }

    public function momo(): static
    {
        return $this->state(fn (array $attributes) => [
            'method' => PayMethod::Momo,
        ]);
    }
}
