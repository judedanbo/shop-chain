<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Models\AdminExpense;
use ShopChain\Core\Models\AdminExpenseAttachment;

/**
 * @extends Factory<AdminExpenseAttachment>
 */
class AdminExpenseAttachmentFactory extends Factory
{
    protected $model = AdminExpenseAttachment::class;

    public function definition(): array
    {
        return [
            'expense_id' => AdminExpense::factory(),
            'name' => fake()->word() . '.pdf',
            'type' => 'application/pdf',
            'size' => fake()->numberBetween(1000, 5000000),
            'url' => fake()->url(),
            'added_at' => now(),
        ];
    }
}
