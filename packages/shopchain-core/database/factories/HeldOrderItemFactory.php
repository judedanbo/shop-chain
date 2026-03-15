<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Models\HeldOrderItem;

/**
 * @extends Factory<HeldOrderItem>
 */
class HeldOrderItemFactory extends Factory
{
    protected $model = HeldOrderItem::class;

    public function definition(): array
    {
        return [
            'held_order_id' => null,
            'product_id' => null,
            'quantity' => fake()->numberBetween(1, 5),
            'notes' => null,
        ];
    }
}
