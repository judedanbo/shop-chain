<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\ExpenseCategory;
use ShopChain\Core\Models\AdminExpense;

/**
 * @extends Factory<AdminExpense>
 */
class AdminExpenseFactory extends Factory
{
    protected $model = AdminExpense::class;

    public function definition(): array
    {
        return [
            'date' => fake()->date(),
            'category' => ExpenseCategory::Infrastructure,
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 100, 50000),
            'vendor' => fake()->company(),
            'recurring' => false,
            'reference' => fake()->optional()->bothify('EXP-####'),
            'created_by' => \App\Models\User::factory(),
        ];
    }

    public function recurring(): static
    {
        return $this->state(fn (array $attributes) => [
            'recurring' => true,
        ]);
    }
}
