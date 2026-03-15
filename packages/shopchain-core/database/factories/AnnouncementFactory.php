<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\AnnouncementPriority;
use ShopChain\Core\Enums\AnnouncementStatus;
use ShopChain\Core\Enums\AnnouncementTarget;
use ShopChain\Core\Models\Announcement;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'body' => fake()->paragraph(),
            'target' => AnnouncementTarget::All,
            'priority' => AnnouncementPriority::Info,
            'status' => AnnouncementStatus::Draft,
            'created_by' => \App\Models\User::factory(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AnnouncementStatus::Active,
        ]);
    }

    public function critical(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => AnnouncementPriority::Critical,
        ]);
    }

    public function forPlan(AnnouncementTarget $target): static
    {
        return $this->state(fn (array $attributes) => [
            'target' => $target,
        ]);
    }
}
