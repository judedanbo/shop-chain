<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Models\PosHeldOrder;

/**
 * @extends Factory<PosHeldOrder>
 */
class PosHeldOrderFactory extends Factory
{
    protected $model = PosHeldOrder::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'branch_id' => null,
            'held_by' => null,
            'held_at' => now(),
        ];
    }
}
