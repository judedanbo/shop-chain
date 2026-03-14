<?php

use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\UnitOfMeasure;

it('lists units with product count', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $unit = UnitOfMeasure::factory()->create(['shop_id' => $shop->id]);
    Product::factory()->count(2)->create([
        'shop_id' => $shop->id,
        'unit_id' => $unit->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/units");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.products_count', 2);
});

it('creates a unit', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/units", [
        'name' => 'Kilogram',
        'abbreviation' => 'kg',
        'type' => 'weight',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Kilogram')
        ->assertJsonPath('data.abbreviation', 'kg')
        ->assertJsonPath('data.shop_id', $shop->id);
});

it('enforces unique abbreviation per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    UnitOfMeasure::factory()->create(['shop_id' => $shop->id, 'abbreviation' => 'kg']);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/units", [
        'name' => 'Another Kilogram',
        'abbreviation' => 'kg',
        'type' => 'weight',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['abbreviation']);
});

it('updates a unit', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $unit = UnitOfMeasure::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Old Name',
    ]);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/units/{$unit->id}", [
        'name' => 'New Name',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'New Name');
});

it('prevents deleting a unit with products', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $unit = UnitOfMeasure::factory()->create(['shop_id' => $shop->id]);
    Product::factory()->create([
        'shop_id' => $shop->id,
        'unit_id' => $unit->id,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/units/{$unit->id}");

    $response->assertUnprocessable();
    expect(UnitOfMeasure::withoutGlobalScopes()->find($unit->id))->not->toBeNull();
});

it('deletes an empty unit', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $unit = UnitOfMeasure::factory()->create(['shop_id' => $shop->id]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/units/{$unit->id}");

    $response->assertNoContent();
    expect(UnitOfMeasure::withoutGlobalScopes()->find($unit->id))->toBeNull();
});

it('validates enum type on create', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/units", [
        'name' => 'Invalid',
        'abbreviation' => 'xx',
        'type' => 'invalid_type',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});
