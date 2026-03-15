<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;

function createFinanceAdmin(): User
{
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    AdminUser::create([
        'user_id' => $user->id,
        'role' => AdminRole::SuperAdmin,
        'status' => AdminTeamStatus::Active,
    ]);
    Passport::actingAs($user);

    return $user;
}

it('returns finance dashboard', function () {
    createFinanceAdmin();

    $response = $this->getJson('/api/v1/admin/finances/dashboard');

    $response->assertOk()
        ->assertJsonStructure(['data' => ['total_revenue']]);
});

it('returns revenue breakdown', function () {
    createFinanceAdmin();

    $response = $this->getJson('/api/v1/admin/finances/revenue');

    $response->assertOk();
});

it('returns monthly summary', function () {
    createFinanceAdmin();

    $response = $this->getJson('/api/v1/admin/finances/monthly-summary');

    $response->assertOk();
});

it('returns expenses by category', function () {
    createFinanceAdmin();

    $response = $this->getJson('/api/v1/admin/finances/expenses-by-category');

    $response->assertOk();
});

it('returns profit and loss', function () {
    createFinanceAdmin();

    $response = $this->getJson('/api/v1/admin/finances/profit-and-loss');

    $response->assertOk()
        ->assertJsonStructure(['data' => ['taxes']]);
});

it('forbids non-admin from finance', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/finances/dashboard');

    $response->assertForbidden();
});
