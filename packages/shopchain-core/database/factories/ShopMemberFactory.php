<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\ShopMember;

/**
 * @extends Factory<ShopMember>
 */
class ShopMemberFactory extends Factory
{
    protected $model = ShopMember::class;

    public function definition(): array
    {
        return [
            'user_id' => null,
            'shop_id' => null,
            'role' => ShopRole::Viewer,
            'status' => MemberStatus::Active,
            'joined_at' => now(),
        ];
    }

    public function owner(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => ShopRole::Owner,
        ]);
    }

    public function generalManager(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => ShopRole::GeneralManager,
        ]);
    }

    public function manager(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => ShopRole::Manager,
        ]);
    }
}
