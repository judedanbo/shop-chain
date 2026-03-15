<?php

use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Customer;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Resources\SaleVerificationResource;

function createSaleForVerification(array $shopOverrides = [], ?Customer $customer = null): array
{
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0, ...$shopOverrides]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 25.00, 'name' => 'Rice (5kg)']);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $payload = [
        'branch_id' => $branch->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 50.00,
    ];

    if ($customer) {
        $payload['customer_id'] = $customer->id;
    }

    $response = test()->postJson("/api/v1/shops/{$shop->id}/sales", $payload);
    $response->assertCreated();

    $sale = Sale::withoutGlobalScopes()->find($response->json('data.id'));

    return [
        'shop' => $shop,
        'user' => $user,
        'branch' => $branch,
        'product' => $product,
        'sale' => $sale,
        'verifyToken' => $sale->verify_token,
    ];
}

it('returns verified sale for valid token', function () {
    $customer = null;
    ['shop' => $shop, 'verifyToken' => $token] = createSaleForVerification();

    // Hit the public endpoint without auth
    $response = $this->getJson("/api/v1/verify/{$token}");

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'status',
                'shop_name',
                'branch_name',
                'branch_address',
                'receipt_date',
                'cashier_name',
                'payment_method',
                'items' => [['name', 'quantity', 'unit_price', 'line_total']],
                'summary' => ['subtotal', 'tax', 'total'],
                'reversal_reason',
                'reversed_at',
                'reversal_requested_at',
            ],
        ])
        ->assertJsonPath('data.status', SaleStatus::Completed->value)
        ->assertJsonPath('data.shop_name', $shop->name)
        ->assertJsonPath('data.payment_method', 'Cash');
});

it('returns reversed sale with reversal details', function () {
    ['shop' => $shop, 'sale' => $sale, 'verifyToken' => $token] = createSaleForVerification();

    // Reverse the sale via API
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$sale->id}/reverse", [
        'reason' => 'Customer returned item',
    ])->assertOk();

    // Verify via public endpoint (no auth needed)
    $response = $this->getJson("/api/v1/verify/{$token}");

    $response->assertOk()
        ->assertJsonPath('data.status', SaleStatus::Reversed->value)
        ->assertJsonPath('data.reversal_reason', 'Customer returned item');

    expect($response->json('data.reversed_at'))->not->toBeNull();
});

it('returns pending-reversal sale with request details', function () {
    ['shop' => $shop, 'sale' => $sale, 'verifyToken' => $token] = createSaleForVerification();

    // Request reversal as salesperson
    createMemberWithRole($shop, ShopRole::Salesperson);
    $this->postJson("/api/v1/shops/{$shop->id}/sales/{$sale->id}/request-reversal", [
        'reason' => 'Wrong item sold',
    ])->assertOk();

    // Verify via public endpoint
    $response = $this->getJson("/api/v1/verify/{$token}");

    $response->assertOk()
        ->assertJsonPath('data.status', SaleStatus::PendingReversal->value)
        ->assertJsonPath('data.reversal_reason', 'Wrong item sold');

    expect($response->json('data.reversal_requested_at'))->not->toBeNull();
});

it('masks customer name', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $customer = Customer::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Kwame Boateng',
    ]);

    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 25.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'customer_id' => $customer->id,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        'payment_method' => 'cash',
        'amount_tendered' => 25.00,
    ]);
    $response->assertCreated();

    $sale = Sale::withoutGlobalScopes()->find($response->json('data.id'));

    $verifyResponse = $this->getJson("/api/v1/verify/{$sale->verify_token}");

    $verifyResponse->assertOk()
        ->assertJsonPath('data.customer_name', 'Kwame B.');
});

it('returns null customer_name when no customer', function () {
    ['verifyToken' => $token] = createSaleForVerification();

    $response = $this->getJson("/api/v1/verify/{$token}");

    $response->assertOk()
        ->assertJsonPath('data.customer_name', null);
});

it('maps payment methods to safe labels', function () {
    ['shop' => $shop] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 20.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 30,
    ]);

    // Card payment
    $cardResponse = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
        'payment_method' => 'card',
        'card_type' => 'visa',
    ]);
    $cardResponse->assertCreated();
    $cardSale = Sale::withoutGlobalScopes()->find($cardResponse->json('data.id'));

    $this->getJson("/api/v1/verify/{$cardSale->verify_token}")
        ->assertJsonPath('data.payment_method', 'Card');

    // Momo payment
    $momoResponse = $this->postJson("/api/v1/shops/{$shop->id}/sales", [
        'branch_id' => $branch->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
        'payment_method' => 'momo',
        'momo_provider' => 'MTN',
        'momo_phone' => '0241234567',
    ]);
    $momoResponse->assertCreated();
    $momoSale = Sale::withoutGlobalScopes()->find($momoResponse->json('data.id'));

    $this->getJson("/api/v1/verify/{$momoSale->verify_token}")
        ->assertJsonPath('data.payment_method', 'Mobile Money');
});

it('does not expose sensitive fields', function () {
    ['verifyToken' => $token] = createSaleForVerification();

    $response = $this->getJson("/api/v1/verify/{$token}");

    $response->assertOk();

    $data = $response->json('data');

    expect($data)->not->toHaveKey('id')
        ->not->toHaveKey('shop_id')
        ->not->toHaveKey('branch_id')
        ->not->toHaveKey('customer_id')
        ->not->toHaveKey('cashier_id')
        ->not->toHaveKey('verify_token')
        ->not->toHaveKey('reversed_by')
        ->not->toHaveKey('reversal_requested_by');
});

it('returns 404 for invalid token', function () {
    seedPermissionsAndPlans();

    $response = $this->getJson('/api/v1/verify/invalidtoken1');

    $response->assertNotFound()
        ->assertJsonPath('message', 'Receipt not found.');
});

it('does not require authentication', function () {
    seedPermissionsAndPlans();

    // Create a sale directly via the service to avoid needing auth
    $user = App\Models\User::factory()->create();
    $shop = ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $user->id, 'tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 10.00]);
    ProductLocation::create([
        'product_id' => $product->id,
        'branch_id' => $branch->id,
        'quantity' => 10,
    ]);

    // Set shop context for sale creation
    app()->instance('current_shop_id', $shop->id);

    $sale = (new ShopChain\Core\Services\SaleService)->createSale($shop, [
        'branch_id' => $branch->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
        'payment_method' => 'cash',
        'amount_tendered' => 10.00,
    ], $user);

    // Make a completely unauthenticated request
    $response = $this->getJson("/api/v1/verify/{$sale->verify_token}");

    expect($response->status())->not->toBe(401);
    $response->assertOk();
});

it('includes item details with product name', function () {
    ['verifyToken' => $token] = createSaleForVerification();

    $response = $this->getJson("/api/v1/verify/{$token}");

    $response->assertOk()
        ->assertJsonPath('data.items.0.name', 'Rice (5kg)')
        ->assertJsonPath('data.items.0.quantity', 2)
        ->assertJsonPath('data.items.0.unit_price', '25.00')
        ->assertJsonPath('data.items.0.line_total', '50.00');
});

it('masks customer name correctly for edge cases', function () {
    expect(SaleVerificationResource::maskCustomerName(null))->toBeNull()
        ->and(SaleVerificationResource::maskCustomerName('Kwame'))->toBe('Kwame')
        ->and(SaleVerificationResource::maskCustomerName('Kwame Boateng'))->toBe('Kwame B.')
        ->and(SaleVerificationResource::maskCustomerName('Ama Serwaa Bonsu'))->toBe('Ama S.');
});
