<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\OrderType;
use ShopChain\Core\Models\HeldOrder;

/**
 * @extends Factory<HeldOrder>
 */
class HeldOrderFactory extends Factory
{
    protected $model = HeldOrder::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'till_id' => null,
            'order_type' => OrderType::DineIn,
            'held_at' => now(),
            'table_number' => null,
            'label' => null,
        ];
    }

    public function takeaway(): static
    {
        return $this->state(fn (array $attributes) => [
            'order_type' => OrderType::Takeaway,
        ]);
    }

    public function withTable(string $table = 'Table 1'): static
    {
        return $this->state(fn (array $attributes) => [
            'table_number' => $table,
        ]);
    }

    public function withLabel(string $label = 'VIP Guest'): static
    {
        return $this->state(fn (array $attributes) => [
            'label' => $label,
        ]);
    }
}
