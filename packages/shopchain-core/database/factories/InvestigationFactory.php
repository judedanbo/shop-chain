<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\InvestigationStatus;
use ShopChain\Core\Enums\RiskLevel;
use ShopChain\Core\Models\Investigation;

/**
 * @extends Factory<Investigation>
 */
class InvestigationFactory extends Factory
{
    protected $model = Investigation::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'status' => InvestigationStatus::Open,
            'priority' => RiskLevel::Medium,
            'assignee_id' => \App\Models\User::factory(),
            'description' => fake()->paragraph(),
            'impact' => null,
            'findings' => null,
            'resolution' => null,
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InvestigationStatus::InProgress,
        ]);
    }

    public function escalated(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InvestigationStatus::Escalated,
            'priority' => RiskLevel::High,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InvestigationStatus::Closed,
            'resolution' => fake()->paragraph(),
        ]);
    }
}
