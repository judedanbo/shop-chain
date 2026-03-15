<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\ShopStatus;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\Shop;

function createShopManagementAdmin(): User
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

it('lists shops for admin', function () {
    $user = createShopManagementAdmin();

    Shop::factory()->create(['owner_id' => $user->id]);

    $response = $this->getJson('/api/v1/admin/shops');

    $response->assertOk();
});

it('shows shop details', function () {
    $user = createShopManagementAdmin();

    $shop = Shop::factory()->create(['owner_id' => $user->id]);

    $response = $this->getJson("/api/v1/admin/shops/{$shop->id}");

    $response->assertOk();
});

it('suspends a shop', function () {
    $user = createShopManagementAdmin();

    $shop = Shop::factory()->create([
        'owner_id' => $user->id,
        'status' => ShopStatus::Active,
    ]);

    $response = $this->postJson("/api/v1/admin/shops/{$shop->id}/suspend");

    $response->assertOk()
        ->assertJsonPath('data.status', 'suspended');
});

it('reactivates a suspended shop', function () {
    $user = createShopManagementAdmin();

    $shop = Shop::factory()->create([
        'owner_id' => $user->id,
        'status' => ShopStatus::Suspended,
    ]);

    $response = $this->postJson("/api/v1/admin/shops/{$shop->id}/reactivate");

    $response->assertOk()
        ->assertJsonPath('data.status', 'active');
});

it('prevents suspending already suspended shop', function () {
    $user = createShopManagementAdmin();

    $shop = Shop::factory()->create([
        'owner_id' => $user->id,
        'status' => ShopStatus::Suspended,
    ]);

    $response = $this->postJson("/api/v1/admin/shops/{$shop->id}/suspend");

    $response->assertStatus(500);
});

it('forbids non-admin from shop management', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/shops');

    $response->assertForbidden();
});
