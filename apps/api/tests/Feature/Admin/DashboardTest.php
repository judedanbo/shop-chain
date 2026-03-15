<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;

function createDashboardAdmin(): User
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

it('returns dashboard overview', function () {
    createDashboardAdmin();

    $response = $this->getJson('/api/v1/admin/dashboard/overview');

    $response->assertOk()
        ->assertJsonStructure(['data' => ['total_users', 'total_shops']]);
});

it('returns user growth data', function () {
    createDashboardAdmin();

    $response = $this->getJson('/api/v1/admin/dashboard/user-growth');

    $response->assertOk();
});

it('returns revenue trend', function () {
    createDashboardAdmin();

    $response = $this->getJson('/api/v1/admin/dashboard/revenue-trend');

    $response->assertOk();
});

it('includes plan distribution in overview', function () {
    createDashboardAdmin();

    $response = $this->getJson('/api/v1/admin/dashboard/overview');

    $response->assertOk()
        ->assertJsonStructure(['data' => ['plan_distribution']]);
});

it('forbids non-admin from dashboard', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/dashboard/overview');

    $response->assertForbidden();
});
