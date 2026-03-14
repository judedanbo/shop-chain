<?php

use ShopChain\Core\Enums\AdjustmentStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\StockAdjustment;
use ShopChain\Core\Models\Warehouse;

it('lists stock adjustments', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    StockAdjustment::factory()->count(3)->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/adjustments");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates an adjustment with pending status', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/adjustments", [
        'product_id' => $product->id,
        'type' => 'recount',
        'quantity_change' => 10,
        'reason' => 'Recount after audit',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.quantity_change', 10);
});

it('approves adjustment and updates product location', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    $adjustment = StockAdjustment::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'quantity_change' => 25,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/adjustments/{$adjustment->id}/approve");

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'approved');

    $location = ProductLocation::where('product_id', $product->id)
        ->where('warehouse_id', $warehouse->id)
        ->first();

    expect($location)->not->toBeNull()
        ->and($location->quantity)->toBe(25);
});

it('rejects an adjustment', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $adjustment = StockAdjustment::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'quantity_change' => 10,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/adjustments/{$adjustment->id}/reject", [
        'reason' => 'Insufficient evidence',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'rejected');
});

it('cannot approve a non-pending adjustment', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $adjustment = StockAdjustment::factory()->approved()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'quantity_change' => 10,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/adjustments/{$adjustment->id}/approve");

    $response->assertUnprocessable();
});

it('filters adjustments by status', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    StockAdjustment::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'status' => AdjustmentStatus::Pending,
        'created_by' => $user->id,
    ]);
    StockAdjustment::factory()->approved()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/adjustments?filter[status]=pending");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('filters adjustments by product', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product1 = Product::factory()->create(['shop_id' => $shop->id]);
    $product2 = Product::factory()->create(['shop_id' => $shop->id]);

    StockAdjustment::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product1->id,
        'created_by' => $user->id,
    ]);
    StockAdjustment::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product2->id,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/adjustments?filter[product_id]={$product1->id}");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('forbids viewer from creating adjustments', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/adjustments", [
        'product_id' => $product->id,
        'type' => 'recount',
        'quantity_change' => 5,
        'reason' => 'Test',
    ]);

    $response->assertForbidden();
});

it('forbids inventory officer from approving adjustments', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $adjustment = StockAdjustment::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'created_by' => $owner->id,
    ]);

    createMemberWithRole($shop, ShopRole::InventoryOfficer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/adjustments/{$adjustment->id}/approve");

    $response->assertForbidden();
});
