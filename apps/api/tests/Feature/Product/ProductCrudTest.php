<?php

use ShopChain\Core\Enums\ProductStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Category;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\UnitOfMeasure;

it('lists products for a shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Product::factory()->count(3)->create(['shop_id' => $shop->id]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/products");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates a product', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/products", [
        'sku' => 'SKU-001',
        'name' => 'Test Product',
        'price' => 19.99,
        'cost' => 10.00,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.sku', 'SKU-001')
        ->assertJsonPath('data.name', 'Test Product')
        ->assertJsonPath('data.shop_id', $shop->id);
});

it('enforces unique SKU per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Product::factory()->create(['shop_id' => $shop->id, 'sku' => 'SKU-001']);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/products", [
        'sku' => 'SKU-001',
        'name' => 'Duplicate SKU',
        'price' => 10.00,
        'cost' => 5.00,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['sku']);
});

it('allows same SKU across different shops', function () {
    ['user' => $user1, 'shop' => $shop1] = createOwnerWithShop();

    Product::factory()->create(['shop_id' => $shop1->id, 'sku' => 'SKU-001']);

    // Create a second shop with owner
    ['shop' => $shop2] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop2->id}/products", [
        'sku' => 'SKU-001',
        'name' => 'Same SKU Different Shop',
        'price' => 10.00,
        'cost' => 5.00,
    ]);

    $response->assertCreated();
});

it('shows a product with includes', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $category = Category::factory()->create(['shop_id' => $shop->id]);
    $unit = UnitOfMeasure::factory()->create(['shop_id' => $shop->id]);

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
        'unit_id' => $unit->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/products/{$product->id}");

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $product->id)
        ->assertJsonPath('data.category.id', $category->id)
        ->assertJsonPath('data.unit.id', $unit->id);
});

it('updates a product', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Old Name',
    ]);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/products/{$product->id}", [
        'name' => 'New Name',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'New Name');
});

it('deletes a product', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/products/{$product->id}");

    $response->assertNoContent();
    expect(Product::withoutGlobalScopes()->find($product->id))->toBeNull();
});

it('blocks product creation when plan limit reached', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Free plan allows 50 products — create 50
    Product::factory()->count(50)->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/products", [
        'sku' => 'SKU-OVER-LIMIT',
        'name' => 'Over Limit',
        'price' => 10.00,
        'cost' => 5.00,
    ]);

    $response->assertForbidden()
        ->assertJsonPath('limit', 'productsPerShop');
});

it('forbids viewer from creating products', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/products", [
        'sku' => 'SKU-001',
        'name' => 'Forbidden',
        'price' => 10.00,
        'cost' => 5.00,
    ]);

    $response->assertForbidden();
});

it('forbids manager from deleting products', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Manager);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/products/{$product->id}");

    $response->assertForbidden();
});

it('allows manager to edit products', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Original',
    ]);

    createMemberWithRole($shop, ShopRole::Manager);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/products/{$product->id}", [
        'name' => 'Updated by Manager',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'Updated by Manager');
});

it('validates required fields on create', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/products", []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['sku', 'name', 'price', 'cost']);
});

it('filters products by status', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Product::factory()->create(['shop_id' => $shop->id, 'status' => ProductStatus::InStock]);
    Product::factory()->lowStock()->create(['shop_id' => $shop->id]);
    Product::factory()->outOfStock()->create(['shop_id' => $shop->id]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/products?filter[status]=in_stock");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('sorts products by price', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00, 'name' => 'Mid']);
    Product::factory()->create(['shop_id' => $shop->id, 'price' => 10.00, 'name' => 'Low']);
    Product::factory()->create(['shop_id' => $shop->id, 'price' => 100.00, 'name' => 'High']);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/products?sort=price");

    $response->assertSuccessful();
    $data = $response->json('data');
    expect($data[0]['price'])->toBe('10.00')
        ->and($data[2]['price'])->toBe('100.00');
});

it('includes category and unit via query builder', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $category = Category::factory()->create(['shop_id' => $shop->id, 'name' => 'Electronics']);
    $product = Product::factory()->create([
        'shop_id' => $shop->id,
        'category_id' => $category->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/products?include=category");

    $response->assertSuccessful()
        ->assertJsonPath('data.0.category.name', 'Electronics');
});

it('paginates products', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Product::factory()->count(20)->create(['shop_id' => $shop->id]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/products?per_page=5");

    $response->assertSuccessful()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.per_page', 5);
});
