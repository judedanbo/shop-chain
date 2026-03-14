<?php

namespace ShopChain\Core\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use ShopChain\Core\Enums\SaleSource;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Models\Sale;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    protected $model = Sale::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 10, 500);

        return [
            'shop_id' => null,
            'branch_id' => null,
            'cashier_id' => User::factory(),
            'subtotal' => $subtotal,
            'tax' => 0,
            'discount' => 0,
            'total' => $subtotal,
            'status' => SaleStatus::Completed,
            'source' => SaleSource::Pos,
            'verify_token' => Str::random(12),
        ];
    }

    public function reversed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SaleStatus::Reversed,
        ]);
    }

    public function pendingReversal(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SaleStatus::PendingReversal,
        ]);
    }
}
