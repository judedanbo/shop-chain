<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\KitchenItemStatus;
use ShopChain\Core\Models\KitchenOrderItem;

/**
 * @extends Factory<KitchenOrderItem>
 */
class KitchenOrderItemFactory extends Factory
{
    protected $model = KitchenOrderItem::class;

    public function definition(): array
    {
        return [
            'order_id' => null,
            'product_id' => null,
            'quantity' => fake()->numberBetween(1, 5),
            'notes' => null,
            'status' => KitchenItemStatus::Pending,
        ];
    }
}
