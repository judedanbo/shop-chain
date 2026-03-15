<?php

namespace ShopChain\Core\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Models\Till;

/**
 * @extends Factory<Till>
 */
class TillFactory extends Factory
{
    protected $model = Till::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'branch_id' => null,
            'name' => 'Till '.fake()->numberBetween(1, 99),
            'opened_by' => User::factory(),
            'opened_at' => now(),
            'is_active' => true,
            'opening_float' => fake()->randomFloat(2, 50, 500),
        ];
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'closed_at' => now(),
            'closing_balance' => fake()->randomFloat(2, 100, 2000),
            'closed_by' => User::factory(),
        ]);
    }
}
