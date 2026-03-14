<?php

use ShopChain\Core\Enums\PoStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\PurchaseOrder;
use ShopChain\Core\Models\Supplier;
use ShopChain\Core\Models\Warehouse;

it('lists purchase orders', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    PurchaseOrder::factory()->count(3)->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/purchase-orders");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates a purchase order with items', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders", [
        'supplier_id' => $supplier->id,
        'payment_terms' => 'net30',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity_ordered' => 100,
                'unit_cost' => 5.50,
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.supplier_id', $supplier->id)
        ->assertJsonCount(1, 'data.items');
});

it('shows a purchase order with items', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $po->items()->create([
        'product_id' => $product->id,
        'quantity_ordered' => 50,
        'unit_cost' => 10.00,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}");

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $po->id)
        ->assertJsonCount(1, 'data.items');
});

it('submits a draft purchase order to pending', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/submit");

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'pending');
});

it('approves a pending purchase order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->pending()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/approve");

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'approved')
        ->assertJsonPath('data.approved_by', $user->id);
});

it('marks an approved purchase order as shipped', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->approved()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/ship");

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'shipped');
});

it('receives a shipped purchase order fully', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->shipped()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'warehouse_id' => $warehouse->id,
        'created_by' => $user->id,
    ]);

    $poItem = $po->items()->create([
        'product_id' => $product->id,
        'quantity_ordered' => 50,
        'unit_cost' => 10.00,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/receive", [
        'items' => [
            [
                'po_item_id' => $poItem->id,
                'quantity_received' => 50,
            ],
        ],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'received');

    expect($response->json('data.received_date'))->not->toBeNull();

    $location = ProductLocation::where('product_id', $product->id)
        ->where('warehouse_id', $warehouse->id)
        ->first();

    expect($location)->not->toBeNull()
        ->and($location->quantity)->toBe(50);
});

it('receives a purchase order partially', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->shipped()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'warehouse_id' => $warehouse->id,
        'created_by' => $user->id,
    ]);

    $poItem = $po->items()->create([
        'product_id' => $product->id,
        'quantity_ordered' => 50,
        'unit_cost' => 10.00,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/receive", [
        'items' => [
            [
                'po_item_id' => $poItem->id,
                'quantity_received' => 20,
            ],
        ],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'partial');
});

it('creates batches for batch-tracked products on receive', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $warehouse = Warehouse::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->batchTracked()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->shipped()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'warehouse_id' => $warehouse->id,
        'created_by' => $user->id,
    ]);

    $poItem = $po->items()->create([
        'product_id' => $product->id,
        'quantity_ordered' => 30,
        'unit_cost' => 8.00,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/receive", [
        'items' => [
            [
                'po_item_id' => $poItem->id,
                'quantity_received' => 30,
                'batch_number' => 'BATCH-2026-001',
            ],
        ],
    ]);

    $response->assertSuccessful();

    $batch = Batch::where('product_id', $product->id)
        ->where('source_po_id', $po->id)
        ->first();

    expect($batch)->not->toBeNull()
        ->and($batch->batch_number)->toBe('BATCH-2026-001')
        ->and($batch->quantity)->toBe(30)
        ->and($batch->initial_quantity)->toBe(30);
});

it('cancels a draft purchase order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/cancel");

    $response->assertSuccessful()
        ->assertJsonPath('data.status', 'cancelled');
});

it('cannot approve a non-pending purchase order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/approve");

    $response->assertUnprocessable();
});

it('cannot receive a non-shipped purchase order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->pending()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $poItem = $po->items()->create([
        'product_id' => $product->id,
        'quantity_ordered' => 50,
        'unit_cost' => 10.00,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/receive", [
        'items' => [
            [
                'po_item_id' => $poItem->id,
                'quantity_received' => 50,
            ],
        ],
    ]);

    $response->assertUnprocessable();
});

it('cannot cancel a received purchase order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->received()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/cancel");

    $response->assertUnprocessable();
});

it('filters purchase orders by status', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    PurchaseOrder::factory()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
        'status' => PoStatus::Draft,
    ]);
    PurchaseOrder::factory()->pending()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/purchase-orders?filter[status]=draft");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('forbids viewer from creating purchase orders', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders", [
        'supplier_id' => $supplier->id,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity_ordered' => 10,
                'unit_cost' => 5.00,
            ],
        ],
    ]);

    $response->assertForbidden();
});

it('forbids inventory officer from approving purchase orders', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    $po = PurchaseOrder::factory()->pending()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $owner->id,
    ]);

    createMemberWithRole($shop, ShopRole::InventoryOfficer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/purchase-orders/{$po->id}/approve");

    $response->assertForbidden();
});
