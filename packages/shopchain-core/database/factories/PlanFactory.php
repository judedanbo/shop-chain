<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\PlanLifecycle;
use ShopChain\Core\Models\Plan;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'id' => fake()->unique()->slug(2),
            'name' => fake()->unique()->words(2, true),
            'price' => fake()->randomFloat(2, 0, 50000),
            'icon' => fake()->optional()->word(),
            'color' => fake()->optional()->hexColor(),
            'badge' => fake()->optional()->word(),
            'limits' => [],
            'features' => [],
            'lifecycle' => PlanLifecycle::Active,
            'available_from' => now(),
            'retire_at' => null,
            'migrate_at' => null,
            'fallback_id' => null,
            'grandfathered' => false,
        ];
    }

    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'id' => 'free',
            'name' => 'Free',
            'price' => 0,
            'lifecycle' => PlanLifecycle::Active,
        ]);
    }

    public function basic(): static
    {
        return $this->state(fn (array $attributes) => [
            'id' => 'basic',
            'name' => 'Basic',
            'price' => 4900,
            'lifecycle' => PlanLifecycle::Active,
        ]);
    }

    public function max(): static
    {
        return $this->state(fn (array $attributes) => [
            'id' => 'max',
            'name' => 'Max',
            'price' => 14900,
            'lifecycle' => PlanLifecycle::Active,
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'lifecycle' => PlanLifecycle::Draft,
        ]);
    }

    public function retiring(): static
    {
        return $this->state(fn (array $attributes) => [
            'lifecycle' => PlanLifecycle::Retiring,
            'retire_at' => now()->addDays(30),
        ]);
    }
}
