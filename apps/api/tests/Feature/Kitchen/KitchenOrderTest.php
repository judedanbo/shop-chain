<?php

use ShopChain\Core\Enums\KitchenItemStatus;
use ShopChain\Core\Enums\KitchenOrderStatus;
use ShopChain\Core\Enums\OrderType;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\KitchenOrder;
use ShopChain\Core\Models\KitchenOrderItem;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Till;

/* ------------------------------------------------------------------ */
/*  Place Order                                                        */
/* ------------------------------------------------------------------ */

it('places a kitchen order with items', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
    ]);
    $product1 = Product::factory()->create(['shop_id' => $shop->id, 'price' => 25.00]);
    $product2 = Product::factory()->create(['shop_id' => $shop->id, 'price' => 15.00]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders", [
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product1->id, 'quantity' => 2, 'notes' => 'No onions'],
            ['product_id' => $product2->id, 'quantity' => 1],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.total', '65.00')
        ->assertJsonPath('data.bar_fulfilled', false)
        ->assertJsonPath('data.order_type', 'dine_in');

    expect($response->json('data.server.id'))->toBe($user->id)
        ->and($response->json('data.items'))->toHaveCount(2);
});

it('splits skip_kitchen items into bar-fulfilled order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
    ]);
    $kitchenProduct = Product::factory()->create(['shop_id' => $shop->id, 'price' => 30.00, 'skip_kitchen' => false]);
    $barProduct = Product::factory()->create(['shop_id' => $shop->id, 'price' => 10.00, 'skip_kitchen' => true]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders", [
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $kitchenProduct->id, 'quantity' => 1],
            ['product_id' => $barProduct->id, 'quantity' => 2],
        ],
    ]);

    // Returns the pending kitchen order
    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.bar_fulfilled', false)
        ->assertJsonPath('data.total', '30.00');

    expect($response->json('data.items'))->toHaveCount(1);

    // Separate bar-fulfilled order should exist
    $barOrder = KitchenOrder::where('bar_fulfilled', true)->first();
    expect($barOrder)->not->toBeNull()
        ->and($barOrder->status)->toBe(KitchenOrderStatus::Completed)
        ->and((float) $barOrder->total)->toBe(20.00)
        ->and($barOrder->completed_at)->not->toBeNull();
});

it('validates till belongs to shop when placing order', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    $otherOwner = \App\Models\User::factory()->create();
    $otherShop = \ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $otherOwner->id]);
    $otherTill = Till::factory()->create([
        'shop_id' => $otherShop->id,
        'branch_id' => Branch::factory()->create(['shop_id' => $otherShop->id])->id,
        'opened_by' => $otherOwner->id,
    ]);

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders", [
        'branch_id' => $branch->id,
        'till_id' => $otherTill->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['till_id']);
});

it('validates branch belongs to shop when placing order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => Branch::factory()->create(['shop_id' => $shop->id])->id,
        'opened_by' => $user->id,
    ]);

    $otherOwner = \App\Models\User::factory()->create();
    $otherShop = \ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $otherOwner->id]);
    $otherBranch = Branch::factory()->create(['shop_id' => $otherShop->id]);

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders", [
        'branch_id' => $otherBranch->id,
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['branch_id']);
});

it('requires items when placing order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders", [
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items']);
});

/* ------------------------------------------------------------------ */
/*  Status Transitions                                                 */
/* ------------------------------------------------------------------ */

it('accepts a pending order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/accept");

    $response->assertOk()
        ->assertJsonPath('data.status', 'accepted');

    expect($response->json('data.accepted_at'))->not->toBeNull();
});

it('rejects a pending order with reason', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/reject", [
        'reason' => 'Out of ingredients',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'rejected')
        ->assertJsonPath('data.rejection_reason', 'Out of ingredients');

    expect($response->json('data.rejected_at'))->not->toBeNull();
});

it('completes an accepted order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->accepted()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/complete");

    $response->assertOk()
        ->assertJsonPath('data.status', 'completed');

    expect($response->json('data.completed_at'))->not->toBeNull();
});

it('serves a completed order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->completed()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/serve");

    $response->assertOk()
        ->assertJsonPath('data.status', 'served');

    expect($response->json('data.served_at'))->not->toBeNull();
});

it('returns a served order with reason', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/return", [
        'reason' => 'Customer complaint',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'returned')
        ->assertJsonPath('data.return_reason', 'Customer complaint');

    expect($response->json('data.returned_at'))->not->toBeNull();
});

it('cancels a pending order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/cancel");

    $response->assertOk()
        ->assertJsonPath('data.status', 'cancelled');

    expect($response->json('data.cancelled_at'))->not->toBeNull();

    $order->refresh();
    expect($order->cancelled_by)->toBe($user->id);
});

it('cancels an accepted order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->accepted()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/cancel");

    $response->assertOk()
        ->assertJsonPath('data.status', 'cancelled');
});

it('rejects invalid transition — accept already-accepted order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->accepted()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/accept");

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

/* ------------------------------------------------------------------ */
/*  Per-Item Status                                                    */
/* ------------------------------------------------------------------ */

it('serves an individual item', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $order = KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);
    $item = KitchenOrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/items/{$item->id}/serve");

    $response->assertOk()
        ->assertJsonPath('data.status', 'served');

    expect($response->json('data.served_at'))->not->toBeNull();
});

it('rejects serving already-served item', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $order = KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);
    $item = KitchenOrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'status' => KitchenItemStatus::Served,
        'served_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/items/{$item->id}/serve");

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

/* ------------------------------------------------------------------ */
/*  List / View                                                        */
/* ------------------------------------------------------------------ */

it('lists orders filtered by status', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);

    KitchenOrder::factory()->count(2)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);
    KitchenOrder::factory()->accepted()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/kitchen-orders?filter[status]=pending");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('lists orders filtered by branch_id', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch1 = Branch::factory()->create(['shop_id' => $shop->id]);
    $branch2 = Branch::factory()->create(['shop_id' => $shop->id]);
    $till1 = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch1->id, 'opened_by' => $user->id]);
    $till2 = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch2->id, 'opened_by' => $user->id]);

    KitchenOrder::factory()->count(3)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch1->id,
        'till_id' => $till1->id,
        'server_id' => $user->id,
    ]);
    KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch2->id,
        'till_id' => $till2->id,
        'server_id' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/kitchen-orders?filter[branch_id]={$branch1->id}");

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('shows order with items and server', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
    ]);
    $order = KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);
    KitchenOrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $order->id)
        ->assertJsonStructure([
            'data' => [
                'id', 'shop_id', 'branch_id', 'till_id', 'table_number',
                'order_type', 'status', 'total', 'bar_fulfilled',
                'server' => ['id', 'name'],
                'items' => [
                    '*' => ['id', 'order_id', 'product_id', 'quantity', 'notes', 'status', 'product'],
                ],
            ],
        ]);
});

/* ------------------------------------------------------------------ */
/*  Authorization                                                      */
/* ------------------------------------------------------------------ */

it('allows bar_manager to place and manage orders', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    ['user' => $barManager] = createMemberWithRole($shop, ShopRole::BarManager);

    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $barManager->id,
    ]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    // Can place order (kitchen.manage + pos.access)
    $placeResponse = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders", [
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $placeResponse->assertCreated();

    $orderId = $placeResponse->json('data.id');

    // Can manage status (kitchen.manage)
    $acceptResponse = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$orderId}/accept");
    $acceptResponse->assertOk();
});

it('allows kitchen_staff to manage orders', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    // Create a pending order as owner
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $owner->id]);
    $order = KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $owner->id,
    ]);

    ['user' => $kitchenStaff] = createMemberWithRole($shop, ShopRole::KitchenStaff);

    // Can manage status (kitchen.manage)
    $response = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$order->id}/accept");
    $response->assertOk();
});

it('allows waiter to place and view but not manage orders', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    ['user' => $waiter] = createMemberWithRole($shop, ShopRole::Waiter);

    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $waiter->id,
    ]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    // Can place order (pos.access)
    $placeResponse = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders", [
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'order_type' => 'dine_in',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $placeResponse->assertCreated();

    $orderId = $placeResponse->json('data.id');

    // Can view (kitchen.view)
    $viewResponse = $this->getJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$orderId}");
    $viewResponse->assertOk();

    // Cannot manage (no kitchen.manage)
    $acceptResponse = $this->postJson("/api/v1/shops/{$shop->id}/kitchen-orders/{$orderId}/accept");
    $acceptResponse->assertForbidden();
});

it('forbids viewer from viewing kitchen orders', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $owner->id]);
    KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $owner->id,
    ]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/kitchen-orders");

    $response->assertForbidden();
});
