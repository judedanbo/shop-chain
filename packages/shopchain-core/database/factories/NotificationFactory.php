<?php

namespace ShopChain\Core\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Models\Notification;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => null,
            'shop_id' => null,
            'title' => fake()->sentence(4),
            'message' => fake()->sentence(8),
            'category' => fake()->randomElement(NotifCategory::cases()),
            'priority' => NotifPriority::Medium,
            'channels' => [NotifChannel::InApp],
            'is_read' => false,
            'requires_action' => false,
        ];
    }

    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_read' => true,
        ]);
    }

    public function actionable(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_action' => true,
            'category' => NotifCategory::ApprovalRequest,
        ]);
    }

    public function withActor(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'actor_id' => $user->id,
        ]);
    }
}
