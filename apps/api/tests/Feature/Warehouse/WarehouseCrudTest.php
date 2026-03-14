<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Subscription;
use ShopChain\Core\Models\Warehouse;

it('lists warehouses for a shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Warehouse::factory()->count(3)->create(['shop_id' => $shop->id]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/warehouses");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates a warehouse', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Basic plan allows 1 warehouse
    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addYear(),
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/warehouses", [
        'name' => 'Main Warehouse',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Main Warehouse')
        ->assertJsonPath('data.shop_id', $shop->id);
});

it('enforces unique warehouse name per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Max plan allows unlimited warehouses
    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'max',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addYear(),
    ]);

    Warehouse::factory()->create(['shop_id' => $shop->id, 'name' => 'Main Warehouse']);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/warehouses", [
        'name' => 'Main Warehouse',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('updates a warehouse', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Old Name',
    ]);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/warehouses/{$warehouse->id}", [
        'name' => 'New Name',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'New Name');
});

it('deletes an empty warehouse', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/warehouses/{$warehouse->id}");

    $response->assertNoContent();
    expect(Warehouse::withoutGlobalScopes()->find($warehouse->id))->toBeNull();
});

it('prevents deletion of warehouse with stock', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    ProductLocation::create([
        'product_id' => Product::factory()->create(['shop_id' => $shop->id])->id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 10,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/warehouses/{$warehouse->id}");

    $response->assertUnprocessable();
    expect(Warehouse::withoutGlobalScopes()->find($warehouse->id))->not->toBeNull();
});

it('blocks warehouse creation when plan limit reached', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Free plan: warehouses = 0
    $response = $this->postJson("/api/v1/shops/{$shop->id}/warehouses", [
        'name' => 'New Warehouse',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('limit', 'warehouses');
});

it('forbids viewer from creating warehouses', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/warehouses", [
        'name' => 'Forbidden Warehouse',
    ]);

    $response->assertForbidden();
});
