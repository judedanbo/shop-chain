<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;

function createUserManagementAdmin(): User
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

it('lists users for admin', function () {
    createUserManagementAdmin();

    $response = $this->getJson('/api/v1/admin/users');

    $response->assertOk();
});

it('shows user details', function () {
    createUserManagementAdmin();

    $target = User::factory()->create();

    $response = $this->getJson("/api/v1/admin/users/{$target->id}");

    $response->assertOk();
});

it('updates user status', function () {
    createUserManagementAdmin();

    $target = User::factory()->create();

    $response = $this->patchJson("/api/v1/admin/users/{$target->id}/status", [
        'status' => 'suspended',
    ]);

    $response->assertOk();
});

it('validates status field', function () {
    createUserManagementAdmin();

    $target = User::factory()->create();

    $response = $this->patchJson("/api/v1/admin/users/{$target->id}/status", [
        'status' => 'invalid_status',
    ]);

    $response->assertUnprocessable();
});

it('forbids non-admin from user management', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/users');

    $response->assertForbidden();
});
