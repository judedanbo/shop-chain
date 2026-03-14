<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\TransferStatus;
use ShopChain\Core\Models\StockTransfer;

/**
 * @extends Factory<StockTransfer>
 */
class StockTransferFactory extends Factory
{
    protected $model = StockTransfer::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'product_id' => null,
            'quantity' => fake()->numberBetween(1, 50),
            'status' => TransferStatus::Pending,
            'created_by' => null,
        ];
    }

    public function inTransit(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TransferStatus::InTransit,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TransferStatus::Completed,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TransferStatus::Cancelled,
        ]);
    }
}
