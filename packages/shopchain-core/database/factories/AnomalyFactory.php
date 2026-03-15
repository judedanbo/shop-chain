<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\AnomalyStatus;
use ShopChain\Core\Enums\RiskLevel;
use ShopChain\Core\Models\Anomaly;

/**
 * @extends Factory<Anomaly>
 */
class AnomalyFactory extends Factory
{
    protected $model = Anomaly::class;

    public function definition(): array
    {
        return [
            'rule' => fake()->word(),
            'severity' => RiskLevel::Medium,
            'entity' => fake()->word(),
            'summary' => fake()->sentence(),
            'status' => AnomalyStatus::Reviewing,
            'investigation_id' => null,
        ];
    }

    public function critical(): static
    {
        return $this->state(fn (array $attributes) => [
            'severity' => RiskLevel::Critical,
        ]);
    }

    public function escalated(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AnomalyStatus::Escalated,
        ]);
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AnomalyStatus::Resolved,
        ]);
    }

    public function dismissed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AnomalyStatus::Dismissed,
        ]);
    }
}
