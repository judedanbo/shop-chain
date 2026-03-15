<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;

/**
 * @extends Factory<AdminUser>
 */
class AdminUserFactory extends Factory
{
    protected $model = AdminUser::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'role' => AdminRole::Admin,
            'status' => AdminTeamStatus::Active,
            'two_fa_enabled' => false,
            'created_by' => null,
            'last_login_at' => fake()->dateTimeThisMonth(),
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => AdminRole::SuperAdmin,
        ]);
    }

    public function auditor(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => AdminRole::Auditor,
        ]);
    }

    public function billingManager(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => AdminRole::BillingManager,
        ]);
    }

    public function supportAgent(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => AdminRole::SupportAgent,
        ]);
    }

    public function invited(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AdminTeamStatus::Invited,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AdminTeamStatus::Suspended,
        ]);
    }
}
