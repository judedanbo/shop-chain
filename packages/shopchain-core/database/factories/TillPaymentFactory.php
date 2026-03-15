<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\TillPayMethod;
use ShopChain\Core\Models\TillPayment;

/**
 * @extends Factory<TillPayment>
 */
class TillPaymentFactory extends Factory
{
    protected $model = TillPayment::class;

    public function definition(): array
    {
        $amount = fake()->randomFloat(2, 5, 200);

        return [
            'till_id' => null,
            'order_id' => null,
            'amount' => $amount,
            'method' => TillPayMethod::Cash,
            'paid_at' => now(),
            'amount_tendered' => $amount,
            'change_given' => 0,
        ];
    }

    public function card(): static
    {
        return $this->state(fn (array $attributes) => [
            'method' => TillPayMethod::Card,
            'amount_tendered' => null,
            'change_given' => null,
            'card_type' => fake()->randomElement(['Visa', 'Mastercard']),
            'card_trans_no' => fake()->bothify('TXN-####-####'),
        ]);
    }

    public function momo(): static
    {
        return $this->state(fn (array $attributes) => [
            'method' => TillPayMethod::Momo,
            'amount_tendered' => null,
            'change_given' => null,
            'momo_provider' => fake()->randomElement(['MTN', 'Vodafone', 'AirtelTigo']),
            'momo_phone' => fake()->numerify('023#######'),
            'momo_trans_id' => fake()->bothify('MOMO-####-####'),
        ]);
    }
}
