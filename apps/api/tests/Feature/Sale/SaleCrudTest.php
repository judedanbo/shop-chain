<?php

use ShopChain\Core\Enums\BatchStatus;
use ShopChain\Core\Enums\PayMethod;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Customer;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Subscription;

it('creates a sale with cash payment', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 25.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 60.00,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.subtotal', '50.00')
        ->assertJsonPath('data.total', '50.00')
        ->assertJsonPath('data.status', SaleStatus::Completed->value)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonCount(1, 'data.payments')
        ->assertJsonPath('data.payments.0.change_given', '10.00');

    expect($response->json('data.verify_token'))->not->toBeNull();

    // Verify stock decremented
    $location = ProductLocation::where('product_id', $product->id)
        ->where('branch_id', $branch->id)
        ->first();
    expect($location->quantity)->toBe(8);
});

it('creates a sale with card payment', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 30.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 5,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'card',
        'card_type' => 'visa',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.payments.0.method', PayMethod::Card->value)
        ->assertJsonPath('data.payments.0.card_type', 'visa');
});

it('creates a sale with momo payment', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 20.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 5,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'momo',
        'momo_provider' => 'MTN',
        'momo_phone' => '0241234567',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.payments.0.method', PayMethod::Momo->value)
        ->assertJsonPath('data.payments.0.momo_provider', 'MTN')
        ->assertJsonPath('data.payments.0.momo_phone', '0241234567');
});

it('creates a sale with split payment on max plan', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);

    // Upgrade to max plan
    $maxPlan = \ShopChain\Core\Models\Plan::find('max');
    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => $maxPlan->id,
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
    ]);

    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 100.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 5,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'split',
        'splits' => [
            ['method' => 'cash', 'amount' => 60.00, 'amount_tendered' => 60.00],
            ['method' => 'momo', 'amount' => 40.00, 'momo_provider' => 'MTN', 'momo_phone' => '0241234567'],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonCount(2, 'data.payments');
});

it('rejects split when plan does not support it', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 5,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'split',
        'splits' => [
            ['method' => 'cash', 'amount' => 25.00, 'amount_tendered' => 25.00],
            ['method' => 'momo', 'amount' => 25.00, 'momo_provider' => 'MTN', 'momo_phone' => '0241234567'],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['payment_method']);
});

it('rejects sale when stock is insufficient', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 10.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 2,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 50.00,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items']);
});

it('decrements batch quantities FEFO for batch-tracked products', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->batchTracked()->create(['shop_id' => $shop->id, 'price' => 10.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 15,
    ]);

    // Batch A: expires sooner, qty 3
    $batchA = Batch::create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'batch_number' => 'BATCH-A',
        'quantity' => 3,
        'initial_quantity' => 3,
        'expiry_date' => now()->addDays(5),
        'status' => BatchStatus::Active,
    ]);

    // Batch B: expires later, qty 10
    $batchB = Batch::create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'batch_number' => 'BATCH-B',
        'quantity' => 10,
        'initial_quantity' => 10,
        'expiry_date' => now()->addDays(30),
        'status' => BatchStatus::Active,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 50.00,
    ]);

    $response->assertCreated();

    // Batch A fully consumed (depleted), Batch B partially consumed
    expect($batchA->fresh()->quantity)->toBe(0)
        ->and($batchA->fresh()->status)->toBe(BatchStatus::Depleted)
        ->and($batchB->fresh()->quantity)->toBe(8);

    // First batch linked to sale item
    expect($response->json('data.items.0.batch_id'))->toBe($batchA->id);
});

it('calculates tax from shop tax rate', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 15.00]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 100.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 115.00,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.subtotal', '100.00')
        ->assertJsonPath('data.tax', '15.00')
        ->assertJsonPath('data.total', '115.00');
});

it('applies percent discount correctly', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 100.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 90.00,
        'discount_input' => 10,
        'discount_type' => 'percent',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.subtotal', '100.00')
        ->assertJsonPath('data.discount', '10.00')
        ->assertJsonPath('data.total', '90.00');
});

it('applies fixed discount correctly', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 100.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 95.00,
        'discount_input' => 5,
        'discount_type' => 'fixed',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.subtotal', '100.00')
        ->assertJsonPath('data.discount', '5.00')
        ->assertJsonPath('data.total', '95.00');
});

it('updates customer stats on sale completion', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $customer = Customer::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'customer_id' => $customer->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 100.00,
    ]);

    $response->assertCreated();

    $customer->refresh();
    expect($customer->visits)->toBe(1)
        ->and((float) $customer->total_spent)->toBe(100.00)
        ->and($customer->loyalty_pts)->toBe(10) // floor(100/10) = 10
        ->and($customer->last_visit)->not->toBeNull();
});

it('lists sales with pagination', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    Sale::factory()->count(5)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales?per_page=3");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data')
        ->assertJsonPath('meta.per_page', 3);
});

it('filters sales by status', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    Sale::factory()->count(2)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'status' => SaleStatus::Completed,
    ]);
    Sale::factory()->reversed()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales?filter[status]=completed");

    $response->assertSuccessful()
        ->assertJsonCount(2, 'data');
});

it('shows a sale with items and payments', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 20.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $createResponse = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 20.00,
    ]);

    $saleId = $createResponse->json('data.id');

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/{$saleId}");

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $saleId)
        ->assertJsonStructure([
            'data' => [
                'items' => [['id', 'product_id', 'quantity', 'unit_price', 'product']],
                'payments' => [['id', 'method', 'amount']],
            ],
        ]);
});

it('enforces plan monthly transaction limit', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 1.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 1000,
    ]);

    // Free plan allows 200 monthly transactions — create 200
    Sale::factory()->count(200)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 1.00,
    ]);

    $response->assertForbidden()
        ->assertJsonPath('limit', 'monthlyTransactions');
});

it('forbids viewer from creating sales', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 10.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 10.00,
    ]);

    $response->assertForbidden();
});

it('allows cashier to create sales', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 10.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    createMemberWithRole($shop, ShopRole::Cashier);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 10.00,
    ]);

    $response->assertCreated();
});

it('rejects cash payment when amount tendered is less than total', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 30.00,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['amount_tendered']);
});
