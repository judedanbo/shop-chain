<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\AuditCategory;
use ShopChain\Core\Models\AuditEvent;

/**
 * @extends Factory<AuditEvent>
 */
class AuditEventFactory extends Factory
{
    protected $model = AuditEvent::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'actor_id' => \App\Models\User::factory(),
            'actor_role' => 'owner',
            'category' => AuditCategory::Data,
            'action' => fake()->word(),
            'target' => fake()->word(),
            'ip_address' => fake()->ipv4(),
            'device' => fake()->userAgent(),
            'session_id' => fake()->uuid(),
            'location' => null,
            'risk_score' => fake()->numberBetween(0, 100),
            'before_data' => null,
            'after_data' => null,
            'note' => fake()->optional()->sentence(),
        ];
    }

    public function highRisk(): static
    {
        return $this->state(fn (array $attributes) => [
            'risk_score' => 90,
            'category' => AuditCategory::Financial,
        ]);
    }

    public function financial(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => AuditCategory::Financial,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => AuditCategory::Admin,
        ]);
    }
}
