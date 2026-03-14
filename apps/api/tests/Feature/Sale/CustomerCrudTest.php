<?php

use ShopChain\Core\Enums\CustomerType;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Customer;
use ShopChain\Core\Models\Sale;

it('lists customers for a shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Customer::factory()->count(3)->create(['shop_id' => $shop->id]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/customers");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates a customer', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/customers", [
        'name' => 'John Doe',
        'phone' => '0241234567',
        'email' => 'john@example.com',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'John Doe')
        ->assertJsonPath('data.phone', '0241234567')
        ->assertJsonPath('data.type', CustomerType::Regular->value);
});

it('enforces unique phone per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Customer::factory()->create(['shop_id' => $shop->id, 'phone' => '0241234567']);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/customers", [
        'name' => 'Duplicate Phone',
        'phone' => '0241234567',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['phone']);
});

it('shows a customer with sales count', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $customer = Customer::factory()->create(['shop_id' => $shop->id]);
    Sale::factory()->count(2)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'customer_id' => $customer->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/customers/{$customer->id}");

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $customer->id)
        ->assertJsonPath('data.sales_count', 2);
});

it('updates a customer', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $customer = Customer::factory()->create(['shop_id' => $shop->id, 'name' => 'Old Name']);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/customers/{$customer->id}", [
        'name' => 'New Name',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'New Name');
});

it('deletes a customer without sales', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $customer = Customer::factory()->create(['shop_id' => $shop->id]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/customers/{$customer->id}");

    $response->assertNoContent();
    expect(Customer::withoutGlobalScopes()->find($customer->id))->toBeNull();
});

it('prevents deleting a customer with sales', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $customer = Customer::factory()->create(['shop_id' => $shop->id]);
    Sale::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'customer_id' => $customer->id,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/customers/{$customer->id}");

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['customer']);
});

it('forbids viewer from creating customers', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/customers", [
        'name' => 'Forbidden',
        'phone' => '0241234567',
    ]);

    $response->assertForbidden();
});

it('allows salesperson to edit customers', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $customer = Customer::factory()->create(['shop_id' => $shop->id, 'name' => 'Original']);

    createMemberWithRole($shop, ShopRole::Salesperson);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/customers/{$customer->id}", [
        'name' => 'Updated by Salesperson',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'Updated by Salesperson');
});

it('rejects duplicate phone for same shop on update', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Customer::factory()->create(['shop_id' => $shop->id, 'phone' => '0241111111']);
    $customer = Customer::factory()->create(['shop_id' => $shop->id, 'phone' => '0242222222']);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/customers/{$customer->id}", [
        'phone' => '0241111111',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['phone']);
});
