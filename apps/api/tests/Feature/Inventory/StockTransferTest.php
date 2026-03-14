<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\StockTransfer;
use ShopChain\Core\Models\Warehouse;

it('lists stock transfers', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    StockTransfer::factory()->count(3)->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/transfers");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates a transfer when source has sufficient stock', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    ProductLocation::create([
        'product_id' => $product->id,
        'warehouse_id' => $fromWarehouse->id,
        'quantity' => 100,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/transfers", [
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'quantity' => 20,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.quantity', 20);
});

it('rejects transfer with insufficient stock', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    ProductLocation::create([
        'product_id' => $product->id,
        'warehouse_id' => $fromWarehouse->id,
        'quantity' => 5,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/transfers", [
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'quantity' => 50,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['quantity']);
});

it('ships a pending transfer', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    $transfer = StockTransfer::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'quantity' => 10,
        'created_by' => $user->id,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/transfers/{$transfer->id}", [
        'action' => 'ship',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'in_transit');
});

it('completes transfer and moves stock between locations', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    ProductLocation::create([
        'product_id' => $product->id,
        'warehouse_id' => $fromWarehouse->id,
        'quantity' => 50,
    ]);

    $transfer = StockTransfer::factory()->inTransit()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'quantity' => 20,
        'created_by' => $user->id,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/transfers/{$transfer->id}", [
        'action' => 'complete',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'completed');

    $sourceLocation = ProductLocation::where('product_id', $product->id)
        ->where('warehouse_id', $fromWarehouse->id)
        ->first();
    $destLocation = ProductLocation::where('product_id', $product->id)
        ->where('warehouse_id', $toWarehouse->id)
        ->first();

    expect($sourceLocation->quantity)->toBe(30)
        ->and($destLocation)->not->toBeNull()
        ->and($destLocation->quantity)->toBe(20);
});

it('cannot complete a pending transfer', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    $transfer = StockTransfer::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'quantity' => 10,
        'created_by' => $user->id,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/transfers/{$transfer->id}", [
        'action' => 'complete',
    ]);

    $response->assertUnprocessable();
});

it('cancels a transfer', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    $transfer = StockTransfer::factory()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'quantity' => 10,
        'created_by' => $user->id,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/transfers/{$transfer->id}", [
        'action' => 'cancel',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'cancelled');
});

it('cannot cancel a completed transfer', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    $transfer = StockTransfer::factory()->completed()->create([
        'shop_id' => $shop->id,
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'quantity' => 10,
        'created_by' => $user->id,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/transfers/{$transfer->id}", [
        'action' => 'cancel',
    ]);

    $response->assertUnprocessable();
});

it('forbids viewer from creating transfers', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $fromWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $toWarehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    ProductLocation::create([
        'product_id' => $product->id,
        'warehouse_id' => $fromWarehouse->id,
        'quantity' => 100,
    ]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/transfers", [
        'product_id' => $product->id,
        'from_warehouse_id' => $fromWarehouse->id,
        'to_warehouse_id' => $toWarehouse->id,
        'quantity' => 10,
    ]);

    $response->assertForbidden();
});
