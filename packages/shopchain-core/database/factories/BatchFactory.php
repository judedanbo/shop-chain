<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\BatchStatus;
use ShopChain\Core\Models\Batch;

/**
 * @extends Factory<Batch>
 */
class BatchFactory extends Factory
{
    protected $model = Batch::class;

    public function definition(): array
    {
        $quantity = fake()->numberBetween(10, 100);

        return [
            'product_id' => null,
            'shop_id' => null,
            'batch_number' => fake()->unique()->bothify('BT-####'),
            'quantity' => $quantity,
            'initial_quantity' => $quantity,
            'received_date' => now(),
            'status' => BatchStatus::Active,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BatchStatus::Expired,
            'expiry_date' => now()->subDay(),
        ]);
    }

    public function depleted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BatchStatus::Depleted,
            'quantity' => 0,
        ]);
    }

    public function withExpiry(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiry_date' => now()->addMonths(6),
        ]);
    }
}
