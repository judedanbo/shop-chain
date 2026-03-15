<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\RiskLevel;
use ShopChain\Core\Models\DetectionRule;

/**
 * @extends Factory<DetectionRule>
 */
class DetectionRuleFactory extends Factory
{
    protected $model = DetectionRule::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'threshold' => fake()->numberBetween(1, 100),
            'severity' => RiskLevel::Medium,
            'enabled' => true,
            'triggers' => 0,
        ];
    }

    public function disabled(): static
    {
        return $this->state(fn (array $attributes) => [
            'enabled' => false,
        ]);
    }

    public function critical(): static
    {
        return $this->state(fn (array $attributes) => [
            'severity' => RiskLevel::Critical,
        ]);
    }
}
