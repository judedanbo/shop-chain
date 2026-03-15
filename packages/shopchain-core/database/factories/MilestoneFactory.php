<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Models\Milestone;

/**
 * @extends Factory<Milestone>
 */
class MilestoneFactory extends Factory
{
    protected $model = Milestone::class;

    public function definition(): array
    {
        return [
            'date' => fake()->date(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'icon' => fake()->optional()->word(),
        ];
    }
}
