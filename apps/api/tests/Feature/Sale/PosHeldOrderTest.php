<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\PosHeldOrder;
use ShopChain\Core\Models\Product;

it('creates a held order with items', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/pos-held-orders", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 3],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.branch_id', $branch->id)
        ->assertJsonPath('data.held_by', $user->id)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.quantity', 3);
});

it('lists held orders for a branch', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $otherBranch = Branch::factory()->create(['shop_id' => $shop->id]);

    PosHeldOrder::factory()->count(2)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'held_by' => $user->id,
    ]);
    PosHeldOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $otherBranch->id,
        'held_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/pos-held-orders?filter[branch_id]={$branch->id}");

    $response->assertSuccessful()
        ->assertJsonCount(2, 'data');
});

it('shows a held order with items', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $order = PosHeldOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'held_by' => $user->id,
    ]);
    $order->items()->create([
        'product_id' => $product->id,
        'quantity' => 2,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/pos-held-orders/{$order->id}");

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $order->id)
        ->assertJsonCount(1, 'data.items');
});

it('recalls a held order and deletes it', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $order = PosHeldOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'held_by' => $user->id,
    ]);
    $order->items()->create([
        'product_id' => $product->id,
        'quantity' => 5,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/pos-held-orders/{$order->id}/recall");

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $order->id)
        ->assertJsonCount(1, 'data.items');

    // Verify deleted
    expect(PosHeldOrder::withoutGlobalScopes()->find($order->id))->toBeNull();
});

it('destroys a held order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    $order = PosHeldOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'held_by' => $user->id,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/pos-held-orders/{$order->id}");

    $response->assertNoContent();
    expect(PosHeldOrder::withoutGlobalScopes()->find($order->id))->toBeNull();
});

it('forbids viewer from creating held orders', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/pos-held-orders", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertForbidden();
});

it('allows cashier to create held orders', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Cashier);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/pos-held-orders", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);

    $response->assertCreated();
});

it('returns held order data on recall before deleting', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Test Product']);

    $order = PosHeldOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'held_by' => $user->id,
    ]);
    $order->items()->create([
        'product_id' => $product->id,
        'quantity' => 2,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/pos-held-orders/{$order->id}/recall");

    $response->assertSuccessful()
        ->assertJsonPath('data.items.0.product.name', 'Test Product')
        ->assertJsonPath('data.items.0.quantity', 2);

    expect(PosHeldOrder::withoutGlobalScopes()->find($order->id))->toBeNull();
});
