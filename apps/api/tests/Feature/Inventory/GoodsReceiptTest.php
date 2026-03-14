<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\GoodsReceipt;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Warehouse;

it('lists goods receipts', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    GoodsReceipt::factory()->count(3)->create([
        'shop_id' => $shop->id,
        'warehouse_id' => $warehouse->id,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/goods-receipts");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates a goods receipt with items and auto-generated reference', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/goods-receipts", [
        'warehouse_id' => $warehouse->id,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 50,
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonCount(1, 'data.items');

    $reference = $response->json('data.reference');
    expect($reference)->toStartWith('GR-'.now()->format('Ymd').'-');
});

it('generates sequential references', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response1 = $this->postJson("/api/v1/shops/{$shop->id}/goods-receipts", [
        'warehouse_id' => $warehouse->id,
        'items' => [['product_id' => $product->id, 'quantity' => 10]],
    ]);

    $response2 = $this->postJson("/api/v1/shops/{$shop->id}/goods-receipts", [
        'warehouse_id' => $warehouse->id,
        'items' => [['product_id' => $product->id, 'quantity' => 20]],
    ]);

    $ref1 = $response1->json('data.reference');
    $ref2 = $response2->json('data.reference');

    expect($ref1)->toEndWith('0001')
        ->and($ref2)->toEndWith('0002');
});

it('completes a receipt and updates product locations', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $receipt = GoodsReceipt::factory()->create([
        'shop_id' => $shop->id,
        'warehouse_id' => $warehouse->id,
        'created_by' => $user->id,
    ]);

    $receipt->items()->create([
        'product_id' => $product->id,
        'quantity' => 30,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/goods-receipts/{$receipt->id}", [
        'action' => 'complete',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'completed');

    $location = ProductLocation::where('product_id', $product->id)
        ->where('warehouse_id', $warehouse->id)
        ->first();

    expect($location)->not->toBeNull()
        ->and($location->quantity)->toBe(30);
});

it('creates batches for batch-tracked products on completion', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->batchTracked()->create(['shop_id' => $shop->id]);

    $receipt = GoodsReceipt::factory()->create([
        'shop_id' => $shop->id,
        'warehouse_id' => $warehouse->id,
        'created_by' => $user->id,
    ]);

    $receipt->items()->create([
        'product_id' => $product->id,
        'quantity' => 100,
        'batch_number' => 'BATCH-001',
        'expiry_date' => now()->addYear(),
    ]);

    $this->patchJson("/api/v1/shops/{$shop->id}/goods-receipts/{$receipt->id}", [
        'action' => 'complete',
    ])->assertSuccessful();

    $batch = Batch::withoutGlobalScopes()
        ->where('product_id', $product->id)
        ->where('batch_number', 'BATCH-001')
        ->first();

    expect($batch)->not->toBeNull()
        ->and($batch->quantity)->toBe(100)
        ->and($batch->initial_quantity)->toBe(100);
});

it('shows a goods receipt with items', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $receipt = GoodsReceipt::factory()->create([
        'shop_id' => $shop->id,
        'warehouse_id' => $warehouse->id,
        'created_by' => $user->id,
    ]);

    $receipt->items()->create([
        'product_id' => $product->id,
        'quantity' => 10,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/goods-receipts/{$receipt->id}");

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $receipt->id)
        ->assertJsonCount(1, 'data.items');
});

it('cannot complete a non-draft receipt', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);

    $receipt = GoodsReceipt::factory()->completed()->create([
        'shop_id' => $shop->id,
        'warehouse_id' => $warehouse->id,
        'created_by' => $user->id,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/goods-receipts/{$receipt->id}", [
        'action' => 'complete',
    ]);

    $response->assertUnprocessable();
});

it('forbids viewer from creating goods receipts', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/goods-receipts", [
        'warehouse_id' => $warehouse->id,
        'items' => [['product_id' => $product->id, 'quantity' => 10]],
    ]);

    $response->assertForbidden();
});
