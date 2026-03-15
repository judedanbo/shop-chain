<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;

function createSettingsAdmin(): User
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

it('returns platform settings', function () {
    createSettingsAdmin();

    $response = $this->getJson('/api/v1/admin/settings');

    $response->assertOk()
        ->assertJsonPath('data.maintenance_mode', false);
});

it('updates platform settings', function () {
    createSettingsAdmin();

    $response = $this->patchJson('/api/v1/admin/settings', [
        'force_2fa' => true,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.force_2fa', true);
});

it('resets platform settings', function () {
    createSettingsAdmin();

    // Update first
    $this->patchJson('/api/v1/admin/settings', [
        'force_2fa' => true,
    ]);

    // Then reset
    $response = $this->postJson('/api/v1/admin/settings/reset');

    $response->assertOk();
});

it('ignores invalid setting keys', function () {
    createSettingsAdmin();

    $response = $this->patchJson('/api/v1/admin/settings', [
        'unknown_key' => true,
    ]);

    $response->assertOk();
    expect($response->json('data'))->not->toHaveKey('unknown_key');
});

it('forbids non-admin from settings', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/settings');

    $response->assertForbidden();
});
