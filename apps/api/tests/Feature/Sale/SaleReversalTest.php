<?php

use ShopChain\Core\Enums\BatchStatus;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Customer;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;

function createCompletedSale(array $shopOverrides = [], ?Customer $customer = null): array
{
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0, ...$shopOverrides]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 25.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $payload = [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 3],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 75.00,
    ];

    if ($customer) {
        $payload['customer_id'] = $customer->id;
    }

    $response = test()->postJson("/api/v1/shops/{$shop->id}/sales", $payload);
    $response->assertCreated();

    return [
        'shop' => $shop,
        'user' => $user,
        'branch' => $branch,
        'product' => $product,
        'saleId' => $response->json('data.id'),
    ];
}

it('sets status to reversed on direct reversal', function () {
    ['shop' => $shop, 'user' => $user, 'saleId' => $saleId] = createCompletedSale();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reverse", [
        'reason' => 'Customer changed mind',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', SaleStatus::Reversed->value)
        ->assertJsonPath('data.reversed_by', $user->id)
        ->assertJsonPath('data.reversal_reason', 'Customer changed mind');

    expect($response->json('data.reversed_at'))->not->toBeNull();
});

it('restores product location stock on direct reversal', function () {
    ['shop' => $shop, 'product' => $product, 'branch' => $branch, 'saleId' => $saleId] = createCompletedSale();

    // Stock should be 10 - 3 = 7 after sale
    $location = ProductLocation::where('product_id', $product->id)
        ->where('branch_id', $branch->id)
        ->first();
    expect($location->quantity)->toBe(7);

    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reverse", [
        'reason' => 'Stock restore test',
    ])->assertOk();

    // Stock should be restored to 10
    expect($location->fresh()->quantity)->toBe(10);
});

it('restores batch quantities in FEFO order on direct reversal', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->batchTracked()->create(['shop_id' => $shop->id, 'price' => 10.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 15,
    ]);

    $batchA = Batch::create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'batch_number' => 'BATCH-A',
        'quantity' => 3,
        'initial_quantity' => 3,
        'expiry_date' => now()->addDays(5),
        'status' => BatchStatus::Active,
    ]);

    $batchB = Batch::create([
        'product_id' => $product->id,
        'shop_id' => $shop->id,
        'batch_number' => 'BATCH-B',
        'quantity' => 10,
        'initial_quantity' => 10,
        'expiry_date' => now()->addDays(30),
        'status' => BatchStatus::Active,
    ]);

    // Sell 5 units: batch A fully consumed (0, depleted), batch B partially (8)
    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 50.00,
    ]);
    $response->assertCreated();
    $saleId = $response->json('data.id');

    expect($batchA->fresh()->quantity)->toBe(0)
        ->and($batchA->fresh()->status)->toBe(BatchStatus::Depleted)
        ->and($batchB->fresh()->quantity)->toBe(8);

    // Reverse the sale
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reverse", [
        'reason' => 'Batch restore test',
    ])->assertOk();

    // Batches should be restored
    expect($batchA->fresh()->quantity)->toBe(3)
        ->and($batchA->fresh()->status)->toBe(BatchStatus::Active)
        ->and($batchB->fresh()->quantity)->toBe(10);
});

it('reverses customer stats clamped to zero', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $customer = Customer::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    // Create sale with customer
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
    $saleId = $response->json('data.id');

    $customer->refresh();
    expect($customer->visits)->toBe(1)
        ->and((float) $customer->total_spent)->toBe(100.00)
        ->and($customer->loyalty_pts)->toBe(10);

    // Reverse
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reverse", [
        'reason' => 'Customer stats test',
    ])->assertOk();

    $customer->refresh();
    expect($customer->visits)->toBe(0)
        ->and((float) $customer->total_spent)->toBe(0.00)
        ->and($customer->loyalty_pts)->toBe(0);
});

it('rejects reversal of already reversed sale', function () {
    ['shop' => $shop, 'saleId' => $saleId] = createCompletedSale();

    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reverse", [
        'reason' => 'First reversal',
    ])->assertOk();

    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reverse", [
        'reason' => 'Second reversal',
    ])->assertUnprocessable();
});

it('rejects direct reversal of pending-reversal sale', function () {
    ['shop' => $shop, 'saleId' => $saleId] = createCompletedSale();

    // Request reversal as a salesperson
    createMemberWithRole($shop, ShopRole::Salesperson);
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/request-reversal", [
        'reason' => 'Wrong item',
    ])->assertOk();

    // Switch back to owner and try direct reversal
    createMemberWithRole($shop, ShopRole::Manager);
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reverse", [
        'reason' => 'Direct reversal attempt',
    ])->assertUnprocessable();
});

it('allows salesperson to request reversal', function () {
    ['shop' => $shop, 'saleId' => $saleId] = createCompletedSale();

    ['user' => $salesperson] = createMemberWithRole($shop, ShopRole::Salesperson);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/request-reversal", [
        'reason' => 'Wrong item sold',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', SaleStatus::PendingReversal->value)
        ->assertJsonPath('data.reversal_requested_by', $salesperson->id)
        ->assertJsonPath('data.reversal_reason', 'Wrong item sold');

    expect($response->json('data.reversal_requested_at'))->not->toBeNull();
});

it('approves reversal and restores stock', function () {
    ['shop' => $shop, 'product' => $product, 'branch' => $branch, 'saleId' => $saleId] = createCompletedSale();

    // Request reversal
    createMemberWithRole($shop, ShopRole::Salesperson);
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/request-reversal", [
        'reason' => 'Wrong item',
    ])->assertOk();

    // Approve as manager
    createMemberWithRole($shop, ShopRole::Manager);
    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/approve-reversal");

    $response->assertOk()
        ->assertJsonPath('data.status', SaleStatus::Reversed->value);

    // Stock restored
    $location = ProductLocation::where('product_id', $product->id)
        ->where('branch_id', $branch->id)
        ->first();
    expect($location->quantity)->toBe(10);
});

it('rejects reversal and returns to completed', function () {
    ['shop' => $shop, 'saleId' => $saleId] = createCompletedSale();

    // Request reversal
    createMemberWithRole($shop, ShopRole::Salesperson);
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/request-reversal", [
        'reason' => 'Wrong item',
    ])->assertOk();

    // Reject as manager
    createMemberWithRole($shop, ShopRole::Manager);
    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reject-reversal");

    $response->assertOk()
        ->assertJsonPath('data.status', SaleStatus::Completed->value);

    expect($response->json('data.reversal_requested_by'))->toBeNull()
        ->and($response->json('data.reversal_requested_at'))->toBeNull()
        ->and($response->json('data.reversal_reason'))->toBeNull();
});

it('forbids salesperson from direct reversal', function () {
    ['shop' => $shop, 'saleId' => $saleId] = createCompletedSale();

    createMemberWithRole($shop, ShopRole::Salesperson);

    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reverse", [
        'reason' => 'Should not work',
    ])->assertForbidden();
});

it('forbids viewer from requesting reversal', function () {
    ['shop' => $shop, 'saleId' => $saleId] = createCompletedSale();

    createMemberWithRole($shop, ShopRole::Viewer);

    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/request-reversal", [
        'reason' => 'Should not work',
    ])->assertForbidden();
});

it('rejects approve on non-pending sale', function () {
    ['shop' => $shop, 'saleId' => $saleId] = createCompletedSale();

    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/approve-reversal")
        ->assertUnprocessable();
});

it('rejects reject on non-pending sale', function () {
    ['shop' => $shop, 'saleId' => $saleId] = createCompletedSale();

    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/reject-reversal")
        ->assertUnprocessable();
});

it('approves reversal and reverses customer stats', function () {
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
    $saleId = $response->json('data.id');

    $customer->refresh();
    expect($customer->visits)->toBe(1)
        ->and((float) $customer->total_spent)->toBe(100.00)
        ->and($customer->loyalty_pts)->toBe(10);

    // Request reversal
    createMemberWithRole($shop, ShopRole::Salesperson);
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/request-reversal", [
        'reason' => 'Customer stats test',
    ])->assertOk();

    // Approve as manager
    createMemberWithRole($shop, ShopRole::Manager);
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$saleId}/approve-reversal")
        ->assertOk();

    $customer->refresh();
    expect($customer->visits)->toBe(0)
        ->and((float) $customer->total_spent)->toBe(0.00)
        ->and($customer->loyalty_pts)->toBe(0);
});
