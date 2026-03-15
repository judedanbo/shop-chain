<?php

use ShopChain\Core\Enums\OrderType;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\HeldOrder;
use ShopChain\Core\Models\HeldOrderItem;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Till;

/* ------------------------------------------------------------------ */
/*  CRUD                                                               */
/* ------------------------------------------------------------------ */

it('creates a held order with items, table, and label', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders", [
        'till_id' => $till->id,
        'table_number' => 'Table 5',
        'order_type' => 'dine_in',
        'label' => 'VIP Guest',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.till_id', $till->id)
        ->assertJsonPath('data.table_number', 'Table 5')
        ->assertJsonPath('data.order_type', 'dine_in')
        ->assertJsonPath('data.label', 'VIP Guest');

    expect($response->json('data.items'))->toHaveCount(1)
        ->and($response->json('data.items.0.quantity'))->toBe(2)
        ->and($response->json('data.held_at'))->not->toBeNull();

    $this->assertDatabaseCount('held_order_items', 1);
});

it('creates a held order with notes on items', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders", [
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'notes' => 'No ice'],
        ],
    ]);

    $response->assertCreated();
    expect($response->json('data.items.0.notes'))->toBe('No ice');

    $this->assertDatabaseHas('held_order_items', ['notes' => 'No ice']);
});

it('validates till belongs to shop', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    ['shop' => $otherShop, 'user' => $otherUser] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $otherShop->id]);
    $till = Till::factory()->create(['shop_id' => $otherShop->id, 'branch_id' => $branch->id, 'opened_by' => $otherUser->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $this->actingAs($user);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders", [
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['till_id']);
});

it('requires items', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders", [
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items']);
});

it('lists held orders filtered by till_id', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till1 = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $till2 = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);

    HeldOrder::factory()->count(2)->create(['shop_id' => $shop->id, 'till_id' => $till1->id]);
    HeldOrder::factory()->create(['shop_id' => $shop->id, 'till_id' => $till2->id]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/held-orders?filter[till_id]={$till1->id}");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('shows held order with items and product details', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $order = HeldOrder::factory()->withTable('Table 3')->create(['shop_id' => $shop->id, 'till_id' => $till->id]);
    HeldOrderItem::factory()->create(['held_order_id' => $order->id, 'product_id' => $product->id, 'quantity' => 3]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/held-orders/{$order->id}");

    $response->assertOk()
        ->assertJsonPath('data.table_number', 'Table 3')
        ->assertJsonPath('data.items.0.quantity', 3)
        ->assertJsonPath('data.items.0.product.id', $product->id);
});

it('destroys a held order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $order = HeldOrder::factory()->create(['shop_id' => $shop->id, 'till_id' => $till->id]);
    HeldOrderItem::factory()->create(['held_order_id' => $order->id, 'product_id' => $product->id]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/held-orders/{$order->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('held_orders', ['id' => $order->id]);
    $this->assertDatabaseCount('held_order_items', 0);
});

/* ------------------------------------------------------------------ */
/*  Recall                                                             */
/* ------------------------------------------------------------------ */

it('recalls a held order — returns data then deletes', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $order = HeldOrder::factory()->withLabel('Rush Order')->create(['shop_id' => $shop->id, 'till_id' => $till->id]);
    HeldOrderItem::factory()->create(['held_order_id' => $order->id, 'product_id' => $product->id, 'quantity' => 2]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders/{$order->id}/recall");

    $response->assertOk()
        ->assertJsonPath('data.label', 'Rush Order')
        ->assertJsonPath('data.items.0.quantity', 2);

    $this->assertDatabaseMissing('held_orders', ['id' => $order->id]);
    $this->assertDatabaseCount('held_order_items', 0);
});

it('returns product data on recall before deleting', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Star Beer']);
    $order = HeldOrder::factory()->create(['shop_id' => $shop->id, 'till_id' => $till->id]);
    HeldOrderItem::factory()->create(['held_order_id' => $order->id, 'product_id' => $product->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders/{$order->id}/recall");

    $response->assertOk()
        ->assertJsonPath('data.items.0.product.name', 'Star Beer')
        ->assertJsonPath('data.items.0.product.id', $product->id);

    $this->assertDatabaseMissing('held_orders', ['id' => $order->id]);
});

/* ------------------------------------------------------------------ */
/*  Authorization                                                      */
/* ------------------------------------------------------------------ */

it('allows bar_manager to create and manage held orders', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    ['user' => $barManager] = createMemberWithRole($shop, ShopRole::BarManager);

    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $barManager->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders", [
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertCreated();
});

it('allows waiter to create held orders via pos.access', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    ['user' => $waiter] = createMemberWithRole($shop, ShopRole::Waiter);

    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $waiter->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders", [
        'till_id' => $till->id,
        'order_type' => 'takeaway',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertCreated();
});

it('forbids viewer from creating held orders', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $owner->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/held-orders", [
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertForbidden();
});
