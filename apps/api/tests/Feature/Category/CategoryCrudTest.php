<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Category;
use ShopChain\Core\Models\Product;

it('lists categories with product count', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $category = Category::factory()->create(['shop_id' => $shop->id]);
    Product::factory()->count(3)->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/categories");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.products_count', 3);
});

it('creates a category', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/categories", [
        'name' => 'Electronics',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Electronics')
        ->assertJsonPath('data.shop_id', $shop->id);
});

it('enforces unique category name per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Category::factory()->create(['shop_id' => $shop->id, 'name' => 'Electronics']);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/categories", [
        'name' => 'Electronics',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('updates a category', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $category = Category::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Old Name',
    ]);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/categories/{$category->id}", [
        'name' => 'New Name',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'New Name');
});

it('prevents deleting a category with products', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $category = Category::factory()->create(['shop_id' => $shop->id]);
    Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/categories/{$category->id}");

    $response->assertUnprocessable();
    expect(Category::withoutGlobalScopes()->find($category->id))->not->toBeNull();
});

it('deletes an empty category', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $category = Category::factory()->create(['shop_id' => $shop->id]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/categories/{$category->id}");

    $response->assertNoContent();
    expect(Category::withoutGlobalScopes()->find($category->id))->toBeNull();
});

it('forbids viewer from creating categories', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/categories", [
        'name' => 'Forbidden',
    ]);

    $response->assertForbidden();
});

it('forbids viewer from deleting categories', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $category = Category::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/categories/{$category->id}");

    $response->assertForbidden();
});
