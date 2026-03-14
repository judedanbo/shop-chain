<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Subscription;

it('lists only shops the user belongs to', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    // Another shop the user is NOT a member of
    Shop::factory()->create(['owner_id' => User::factory()->create()->id]);

    $response = $this->getJson('/api/v1/shops');

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $shop->id);
});

it('creates a shop with default branch', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    // Upgrade to basic plan (allows 3 shops)
    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addYear(),
    ]);

    $response = $this->postJson('/api/v1/shops', [
        'name' => 'New Shop',
        'type' => 'wholesale',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'New Shop')
        ->assertJsonPath('data.type', 'wholesale');

    $newShop = Shop::where('name', 'New Shop')->first();
    expect($newShop)->not->toBeNull();

    // Default branch should be auto-created
    $defaultBranch = Branch::withoutGlobalScopes()
        ->where('shop_id', $newShop->id)
        ->where('is_default', true)
        ->first();
    expect($defaultBranch)->not->toBeNull()
        ->and($defaultBranch->name)->toBe('Main Branch');
});

it('blocks shop creation when plan limit reached', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    // Free plan allows 1 shop — user already owns one
    $response = $this->postJson('/api/v1/shops', [
        'name' => 'Second Shop',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('limit', 'shops');
});

it('shows a shop to a member', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->getJson("/api/v1/shops/{$shop->id}");

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $shop->id)
        ->assertJsonPath('data.name', $shop->name);
});

it('returns 403 when non-member views a shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Act as a different user who is NOT a member
    $outsider = User::factory()->create();
    Passport::actingAs($outsider);

    $response = $this->getJson("/api/v1/shops/{$shop->id}");

    $response->assertForbidden();
});

it('allows owner to update shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}", [
        'name' => 'Updated Name',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'Updated Name');
});

it('forbids viewer from updating shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}", [
        'name' => 'Hacked Name',
    ]);

    $response->assertForbidden();
});

it('allows owner to delete shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}");

    $response->assertNoContent();
    expect(Shop::find($shop->id))->toBeNull();
});

it('forbids non-owner from deleting shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::GeneralManager);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}");

    $response->assertForbidden();
});

it('validates shop creation data', function () {
    createOwnerWithShop();

    $response = $this->postJson('/api/v1/shops', [
        // missing required 'name'
        'type' => 'invalid_type',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'type']);
});
