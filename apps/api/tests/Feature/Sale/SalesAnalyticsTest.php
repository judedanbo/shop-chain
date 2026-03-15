<?php

use App\Models\User;
use Illuminate\Support\Carbon;
use Laravel\Pennant\Feature;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Customer;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\SaleItem;
use ShopChain\Core\Models\SalePayment;
use ShopChain\Core\Models\Shop;

function createTestSale(
    Shop $shop,
    Branch $branch,
    User $cashier,
    array $overrides = [],
): Sale {
    $defaults = [
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'cashier_id' => $cashier->id,
        'status' => SaleStatus::Completed,
        'subtotal' => 100.00,
        'tax' => 0,
        'discount' => 0,
        'total' => 100.00,
    ];

    return Sale::factory()->create(array_merge($defaults, $overrides));
}

function createSaleWithItemsAndPayment(
    Shop $shop,
    Branch $branch,
    User $cashier,
    Product $product,
    array $saleOverrides = [],
    int $quantity = 2,
    string $payMethod = 'cash',
): Sale {
    $total = (float) ($saleOverrides['total'] ?? $product->price * $quantity);
    $subtotal = (float) ($saleOverrides['subtotal'] ?? $total);
    $discount = (float) ($saleOverrides['discount'] ?? 0);

    $sale = createTestSale($shop, $branch, $cashier, array_merge([
        'subtotal' => $subtotal,
        'total' => $total,
        'discount' => $discount,
    ], $saleOverrides));

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => $quantity,
        'unit_price' => $product->price,
        'discount' => 0,
        'line_total' => $product->price * $quantity,
    ]);

    SalePayment::create([
        'sale_id' => $sale->id,
        'method' => $payMethod,
        'label' => ucfirst($payMethod),
        'amount' => $total,
    ]);

    return $sale;
}

it('returns analytics with sales data', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);

    // Create 2 sales today
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, ['total' => 100.00, 'subtotal' => 100.00], 2);
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, ['total' => 50.00, 'subtotal' => 50.00], 1);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk()
        ->assertJsonPath('data.kpis.todays_revenue.amount', '150.00')
        ->assertJsonPath('data.kpis.transactions.count', 2)
        ->assertJsonPath('data.kpis.avg_order_value.amount', '75.00')
        ->assertJsonPath('data.kpis.avg_order_value.items_sold', 3);
});

it('returns zeros with no sales', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk()
        ->assertJsonPath('data.kpis.todays_revenue.amount', '0.00')
        ->assertJsonPath('data.kpis.transactions.count', 0)
        ->assertJsonPath('data.kpis.avg_order_value.amount', '0.00')
        ->assertJsonPath('data.kpis.avg_order_value.items_sold', 0)
        ->assertJsonPath('data.kpis.discounts_given.amount', '0.00');
});

it('filters by branch_id', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch1 = Branch::factory()->create(['shop_id' => $shop->id]);
    $branch2 = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 40.00]);

    createSaleWithItemsAndPayment($shop, $branch1, $user, $product, ['total' => 80.00, 'subtotal' => 80.00], 2);
    createSaleWithItemsAndPayment($shop, $branch2, $user, $product, ['total' => 40.00, 'subtotal' => 40.00], 1);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics?branch_id={$branch1->id}");

    $response->assertOk()
        ->assertJsonPath('data.kpis.todays_revenue.amount', '80.00')
        ->assertJsonPath('data.kpis.transactions.count', 1);
});

it('calculates KPI percent change vs yesterday', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 100.00]);

    // Yesterday: 200
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, [
        'total' => 200.00,
        'subtotal' => 200.00,
        'created_at' => Carbon::yesterday()->setHour(10),
    ], 2);

    // Today: 300
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, [
        'total' => 300.00,
        'subtotal' => 300.00,
    ], 3);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk()
        ->assertJsonPath('data.kpis.todays_revenue.amount', '300.00')
        ->assertJsonPath('data.kpis.todays_revenue.change_percent', 50)
        ->assertJsonPath('data.kpis.transactions.yesterday_count', 1);
});

it('returns null change_percent when yesterday has no sales', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);

    createSaleWithItemsAndPayment($shop, $branch, $user, $product);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk()
        ->assertJsonPath('data.kpis.todays_revenue.change_percent', null);
});

it('returns correct payment method breakdown', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);

    // Cash sale
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, ['total' => 100.00, 'subtotal' => 100.00], 2, 'cash');
    // Momo sale
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, ['total' => 50.00, 'subtotal' => 50.00], 1, 'momo');

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk();

    $methods = collect($response->json('data.charts.payment_methods'));
    $cash = $methods->firstWhere('method', 'cash');
    $momo = $methods->firstWhere('method', 'momo');

    expect($cash['amount'])->toBe('100.00')
        ->and($cash['percentage'])->toBe(66.7)
        ->and($momo['amount'])->toBe('50.00')
        ->and($momo['percentage'])->toBe(33.3);
});

it('returns hourly distribution with peak hour marked', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);

    // Sale at 10am
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, [
        'total' => 50.00,
        'subtotal' => 50.00,
        'created_at' => Carbon::today()->setHour(10),
    ], 1);

    // Two sales at 14:00 (peak)
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, [
        'total' => 100.00,
        'subtotal' => 100.00,
        'created_at' => Carbon::today()->setHour(14),
    ], 2);
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, [
        'total' => 80.00,
        'subtotal' => 80.00,
        'created_at' => Carbon::today()->setHour(14)->setMinute(30),
    ], 1);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk();

    $hours = collect($response->json('data.charts.hourly_distribution'));

    // 17 buckets (6-22)
    expect($hours)->toHaveCount(17);

    $hour10 = $hours->firstWhere('hour', 10);
    $hour14 = $hours->firstWhere('hour', 14);
    $hour12 = $hours->firstWhere('hour', 12);

    expect($hour10['transactions'])->toBe(1)
        ->and($hour10['is_peak'])->toBeFalse()
        ->and($hour14['transactions'])->toBe(2)
        ->and($hour14['is_peak'])->toBeTrue()
        ->and($hour12['transactions'])->toBe(0);
});

it('returns top products ranked by quantity', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $productA = Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Product A', 'price' => 10.00]);
    $productB = Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Product B', 'price' => 20.00]);

    // Product A: 5 units sold
    createSaleWithItemsAndPayment($shop, $branch, $user, $productA, ['total' => 50.00, 'subtotal' => 50.00], 5);
    // Product B: 2 units sold
    createSaleWithItemsAndPayment($shop, $branch, $user, $productB, ['total' => 40.00, 'subtotal' => 40.00], 2);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk();

    $topProducts = $response->json('data.charts.top_products');

    expect($topProducts[0]['name'])->toBe('Product A')
        ->and($topProducts[0]['quantity'])->toBe(5)
        ->and($topProducts[1]['name'])->toBe('Product B')
        ->and($topProducts[1]['quantity'])->toBe(2);
});

it('returns correct customer mix', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $customer = Customer::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);

    // Registered customer sale
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, [
        'customer_id' => $customer->id,
        'total' => 100.00,
        'subtotal' => 100.00,
    ], 2);

    // Walk-in sales (no customer)
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, ['total' => 50.00, 'subtotal' => 50.00], 1);
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, ['total' => 50.00, 'subtotal' => 50.00], 1);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk();

    $mix = $response->json('data.charts.customer_mix');

    expect($mix['registered']['count'])->toBe(1)
        ->and($mix['registered']['percentage'])->toBe(33.3)
        ->and($mix['registered']['revenue'])->toBe('100.00')
        ->and($mix['walk_in']['count'])->toBe(2)
        ->and($mix['walk_in']['percentage'])->toBe(66.7)
        ->and($mix['walk_in']['revenue'])->toBe('100.00');
});

it('calculates projections from month-to-date data', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);

    createSaleWithItemsAndPayment($shop, $branch, $user, $product, ['total' => 150.00, 'subtotal' => 150.00], 3);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk();

    $projections = $response->json('data.projections');

    expect($projections)->toHaveKeys(['daily_average', 'weekly_projection', 'monthly_projection', 'week_daily_average']);

    // daily_average should be numeric string
    expect((float) $projections['daily_average'])->toBeGreaterThan(0);
});

it('excludes reversed sales from all metrics', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);

    // Completed sale
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, ['total' => 100.00, 'subtotal' => 100.00], 2);

    // Reversed sale — should not count
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, [
        'total' => 200.00,
        'subtotal' => 200.00,
        'status' => SaleStatus::Reversed,
    ], 4);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk()
        ->assertJsonPath('data.kpis.todays_revenue.amount', '100.00')
        ->assertJsonPath('data.kpis.transactions.count', 1);
});

it('allows owner to view analytics', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk();
});

it('allows viewer to view analytics', function () {
    ['shop' => $shop] = createOwnerWithShop();
    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk();
});

it('forbids cashier from viewing analytics', function () {
    ['shop' => $shop] = createOwnerWithShop();
    createMemberWithRole($shop, ShopRole::Cashier);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertForbidden();
});

it('returns 403 when reports feature is inactive', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Feature::for($shop)->deactivate('reports');

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertForbidden()
        ->assertJsonPath('feature', 'reports');
});

it('has complete response structure', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 50.00]);

    createSaleWithItemsAndPayment($shop, $branch, $user, $product);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'kpis' => [
                    'todays_revenue' => ['amount', 'change_percent'],
                    'transactions' => ['count', 'yesterday_count'],
                    'avg_order_value' => ['amount', 'items_sold'],
                    'discounts_given' => ['amount', 'percent_of_gross'],
                ],
                'period_comparison' => [
                    'today' => ['revenue', 'transactions', 'items_sold', 'discounts'],
                    'yesterday' => ['revenue', 'transactions', 'items_sold', 'discounts'],
                    'this_week' => ['revenue', 'transactions', 'items_sold', 'discounts'],
                    'this_month' => ['revenue', 'transactions', 'items_sold', 'discounts'],
                ],
                'charts' => [
                    'seven_day_revenue',
                    'payment_methods',
                    'hourly_distribution',
                    'top_products',
                    'customer_mix' => [
                        'registered' => ['count', 'percentage', 'revenue'],
                        'walk_in' => ['count', 'percentage', 'revenue'],
                    ],
                ],
                'projections' => [
                    'daily_average',
                    'weekly_projection',
                    'monthly_projection',
                    'week_daily_average',
                ],
            ],
        ]);
});

it('includes discount data in KPIs', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop(['tax_rate' => 0]);
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $product = Product::factory()->create(['shop_id' => $shop->id, 'price' => 100.00]);

    // Sale with 10.00 discount
    createSaleWithItemsAndPayment($shop, $branch, $user, $product, [
        'subtotal' => 100.00,
        'discount' => 10.00,
        'total' => 90.00,
    ], 1);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/sales/analytics");

    $response->assertOk()
        ->assertJsonPath('data.kpis.discounts_given.amount', '10.00');

    // percent_of_gross = 10 / (90 + 10) * 100 = 10.0
    expect($response->json('data.kpis.discounts_given.percent_of_gross'))->toBe(10);
});
