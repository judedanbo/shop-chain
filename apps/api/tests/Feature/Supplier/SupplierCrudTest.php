<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\PurchaseOrder;
use ShopChain\Core\Models\Supplier;
use ShopChain\Core\Models\SupplierProduct;

it('lists suppliers for a shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Supplier::factory()->count(3)->create(['shop_id' => $shop->id]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/suppliers");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates a supplier', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/suppliers", [
        'name' => 'Accra Supplies Ltd',
        'contact_name' => 'Kwame Mensah',
        'phone' => '+233201234567',
        'email' => 'kwame@accrasupplies.com',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Accra Supplies Ltd')
        ->assertJsonPath('data.shop_id', $shop->id);
});

it('enforces unique supplier name per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Supplier::factory()->create(['shop_id' => $shop->id, 'name' => 'Accra Supplies']);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/suppliers", [
        'name' => 'Accra Supplies',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('updates a supplier', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $supplier = Supplier::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Old Name',
    ]);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/suppliers/{$supplier->id}", [
        'name' => 'New Name',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'New Name');
});

it('deletes a supplier without purchase orders', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/suppliers/{$supplier->id}");

    $response->assertNoContent();
    expect(Supplier::withoutGlobalScopes()->find($supplier->id))->toBeNull();
});

it('prevents deletion of supplier with purchase orders', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    PurchaseOrder::factory()->create([
        'shop_id' => $shop->id,
        'supplier_id' => $supplier->id,
        'created_by' => $user->id,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/suppliers/{$supplier->id}");

    $response->assertUnprocessable();
    expect(Supplier::withoutGlobalScopes()->find($supplier->id))->not->toBeNull();
});

it('blocks supplier creation when plan limit reached', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Free plan allows 5 suppliers
    Supplier::factory()->count(5)->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/suppliers", [
        'name' => 'Over Limit Supplier',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('limit', 'suppliers');
});

it('links a product to a supplier', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/suppliers/{$supplier->id}/products", [
        'product_id' => $product->id,
        'unit_cost' => 15.50,
        'lead_time_days' => 7,
        'is_preferred' => true,
    ]);

    $response->assertSuccessful();

    expect($supplier->products()->where('product_id', $product->id)->exists())->toBeTrue();
});

it('lists supplier products', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $products = Product::factory()->count(3)->create(['shop_id' => $shop->id]);

    foreach ($products as $product) {
        SupplierProduct::create([
            'supplier_id' => $supplier->id,
            'product_id' => $product->id,
            'unit_cost' => 10.00,
        ]);
    }

    $response = $this->getJson("/api/v1/shops/{$shop->id}/suppliers/{$supplier->id}/products");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('unlinks a product from a supplier', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id]);

    SupplierProduct::create([
        'supplier_id' => $supplier->id,
        'product_id' => $product->id,
        'unit_cost' => 10.00,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/suppliers/{$supplier->id}/products/{$product->id}");

    $response->assertNoContent();
    expect(SupplierProduct::where('supplier_id', $supplier->id)->where('product_id', $product->id)->exists())->toBeFalse();
});

it('forbids viewer from creating suppliers', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/suppliers", [
        'name' => 'Forbidden Supplier',
    ]);

    $response->assertForbidden();
});

it('forbids viewer from deleting suppliers', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $supplier = Supplier::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/suppliers/{$supplier->id}");

    $response->assertForbidden();
});
