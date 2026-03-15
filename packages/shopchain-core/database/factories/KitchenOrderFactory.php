<?php

namespace ShopChain\Core\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\KitchenOrderStatus;
use ShopChain\Core\Enums\OrderType;
use ShopChain\Core\Models\KitchenOrder;

/**
 * @extends Factory<KitchenOrder>
 */
class KitchenOrderFactory extends Factory
{
    protected $model = KitchenOrder::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'branch_id' => null,
            'till_id' => null,
            'order_type' => OrderType::DineIn,
            'status' => KitchenOrderStatus::Pending,
            'total' => fake()->randomFloat(2, 10, 500),
            'bar_fulfilled' => false,
            'server_id' => User::factory(),
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KitchenOrderStatus::Accepted,
            'accepted_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KitchenOrderStatus::Completed,
            'accepted_at' => now(),
            'completed_at' => now(),
        ]);
    }

    public function served(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KitchenOrderStatus::Served,
            'accepted_at' => now(),
            'completed_at' => now(),
            'served_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KitchenOrderStatus::Rejected,
            'rejected_at' => now(),
            'rejection_reason' => fake()->sentence(),
        ]);
    }

    public function returned(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KitchenOrderStatus::Returned,
            'accepted_at' => now(),
            'completed_at' => now(),
            'served_at' => now(),
            'returned_at' => now(),
            'return_reason' => fake()->sentence(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KitchenOrderStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => User::factory(),
        ]);
    }

    public function barFulfilled(): static
    {
        return $this->state(fn (array $attributes) => [
            'bar_fulfilled' => true,
            'status' => KitchenOrderStatus::Completed,
            'completed_at' => now(),
        ]);
    }

    public function takeaway(): static
    {
        return $this->state(fn (array $attributes) => [
            'order_type' => OrderType::Takeaway,
        ]);
    }
}
