<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\PriceHistory;
use ShopChain\Core\Models\Product;

it('updates product price and records history', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'price' => 20.00,
        'cost' => 10.00,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/products/{$product->id}/price", [
        'price' => 25.00,
        'reason' => 'Market adjustment',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.price', '25.00');

    $history = PriceHistory::withoutGlobalScopes()
        ->where('product_id', $product->id)
        ->first();

    expect($history)->not->toBeNull()
        ->and($history->old_price)->toBe('20.00')
        ->and($history->new_price)->toBe('25.00')
        ->and($history->reason)->toBe('Market adjustment')
        ->and($history->changed_by)->toBe($user->id);
});

it('requires products.price permission', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/products/{$product->id}/price", [
        'price' => 30.00,
    ]);

    $response->assertForbidden();
});

it('validates at least one of price or cost is required', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/products/{$product->id}/price", [
        'reason' => 'No price change',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['price']);
});

it('lists price history for a product', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'price' => 10.00,
        'cost' => 5.00,
    ]);

    PriceHistory::withoutGlobalScopes()->create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'old_price' => 10.00,
        'new_price' => 15.00,
        'old_cost' => 5.00,
        'new_cost' => 5.00,
        'changed_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/products/{$product->id}/price-history");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.old_price', '10.00')
        ->assertJsonPath('data.0.new_price', '15.00');
});
