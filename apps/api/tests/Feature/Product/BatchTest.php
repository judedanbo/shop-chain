<?php

use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Product;

it('lists batches in FEFO order', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    Batch::factory()->create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'batch_number' => 'BT-LATER',
        'expiry_date' => now()->addMonths(6),
    ]);
    Batch::factory()->create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'batch_number' => 'BT-SOONER',
        'expiry_date' => now()->addMonth(),
    ]);
    Batch::factory()->create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'batch_number' => 'BT-NOEXP',
        'expiry_date' => null,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/products/{$product->id}/batches");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');

    $data = $response->json('data');
    expect($data[0]['batch_number'])->toBe('BT-SOONER')
        ->and($data[1]['batch_number'])->toBe('BT-LATER')
        ->and($data[2]['batch_number'])->toBe('BT-NOEXP');
});

it('creates a batch for a product', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/products/{$product->id}/batches", [
        'batch_number' => 'BT-NEW',
        'quantity' => 50,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.batch_number', 'BT-NEW')
        ->assertJsonPath('data.quantity', 50)
        ->assertJsonPath('data.initial_quantity', 50);
});

it('enforces unique batch number per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    Batch::factory()->create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'batch_number' => 'BT-DUP',
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/products/{$product->id}/batches", [
        'batch_number' => 'BT-DUP',
        'quantity' => 10,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['batch_number']);
});

it('updates a batch', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);
    $batch = Batch::factory()->create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'quantity' => 100,
    ]);

    $response = $this->patchJson(
        "/api/v1/shops/{$shop->id}/products/{$product->id}/batches/{$batch->id}",
        ['quantity' => 80, 'notes' => 'Adjusted'],
    );

    $response->assertSuccessful()
        ->assertJsonPath('data.quantity', 80)
        ->assertJsonPath('data.notes', 'Adjusted');
});

it('sets initial_quantity on batch creation', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $product = Product::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/products/{$product->id}/batches", [
        'batch_number' => 'BT-INIT',
        'quantity' => 75,
    ]);

    $response->assertCreated();

    $batch = Batch::withoutGlobalScopes()->where('batch_number', 'BT-INIT')->first();
    expect($batch->initial_quantity)->toBe(75);
});
