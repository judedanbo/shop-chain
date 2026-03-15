<?php

use App\Models\User;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\SalePayment;
use ShopChain\Core\Models\Till;

/* ------------------------------------------------------------------ */
/*  Open Till                                                          */
/* ------------------------------------------------------------------ */

it('opens a till with opening float', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $branch->id,
        'name' => 'Main Till',
        'opening_float' => 150.00,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Main Till')
        ->assertJsonPath('data.is_active', true)
        ->assertJsonPath('data.opening_float', '150.00')
        ->assertJsonPath('data.closing_balance', null)
        ->assertJsonPath('data.branch_id', $branch->id);

    expect($response->json('data.opened_by.id'))->toBe($user->id);
});

it('opens a till with zero float by default', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $branch->id,
        'name' => 'Secondary Till',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.opening_float', '0.00');
});

it('validates branch belongs to shop when opening till', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $otherOwner = User::factory()->create();
    $otherShop = \ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $otherOwner->id]);
    $otherBranch = Branch::factory()->create(['shop_id' => $otherShop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $otherBranch->id,
        'name' => 'Bad Till',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['branch_id']);
});

it('allows multiple active tills per branch', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $branch->id,
        'name' => 'Till 1',
    ])->assertCreated();

    $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $branch->id,
        'name' => 'Till 2',
    ])->assertCreated();

    expect(Till::where('branch_id', $branch->id)->where('is_active', true)->count())->toBe(2);
});

it('requires name when opening a till', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $branch->id,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

/* ------------------------------------------------------------------ */
/*  Close Till                                                         */
/* ------------------------------------------------------------------ */

it('closes an active till with closing balance and summary', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
        'opening_float' => 100.00,
    ]);

    // Create a completed cash sale on this till
    $sale = Sale::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'cashier_id' => $user->id,
        'total' => 50.00,
        'subtotal' => 50.00,
        'status' => SaleStatus::Completed,
    ]);
    SalePayment::create([
        'sale_id' => $sale->id,
        'method' => 'cash',
        'amount' => 50.00,
        'amount_tendered' => 60.00,
        'change_given' => 10.00,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 145.00,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.is_active', false)
        ->assertJsonPath('data.closing_balance', '145.00')
        ->assertJsonPath('data.summary.sales_count', 1)
        ->assertJsonPath('data.summary.total_sales', '50.00');

    expect($response->json('data.closed_by.id'))->toBe($user->id)
        ->and($response->json('data.closed_at'))->not->toBeNull();
});

it('rejects closing an already closed till', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->closed()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
        'closed_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 100.00,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['till']);
});

it('requires closing_balance when closing a till', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['closing_balance']);
});

it('computes cash reconciliation correctly', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
        'opening_float' => 200.00,
    ]);

    // Sale 1: cash, tendered 100, change 20 → net cash in = 80
    $sale1 = Sale::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'cashier_id' => $user->id,
        'total' => 80.00,
        'subtotal' => 80.00,
        'status' => SaleStatus::Completed,
    ]);
    SalePayment::create([
        'sale_id' => $sale1->id,
        'method' => 'cash',
        'amount' => 80.00,
        'amount_tendered' => 100.00,
        'change_given' => 20.00,
    ]);

    // Sale 2: card, 50.00
    $sale2 = Sale::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'cashier_id' => $user->id,
        'total' => 50.00,
        'subtotal' => 50.00,
        'status' => SaleStatus::Completed,
    ]);
    SalePayment::create([
        'sale_id' => $sale2->id,
        'method' => 'card',
        'amount' => 50.00,
        'amount_tendered' => 50.00,
        'change_given' => 0,
    ]);

    // expected_cash = 200 (float) + 100 (tendered) - 20 (change) = 280
    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 275.00,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.summary.opening_float', '200.00')
        ->assertJsonPath('data.summary.cash_tendered', '100.00')
        ->assertJsonPath('data.summary.change_given', '20.00')
        ->assertJsonPath('data.summary.expected_cash', '280.00')
        ->assertJsonPath('data.summary.closing_balance', '275.00')
        ->assertJsonPath('data.summary.variance', '-5.00')
        ->assertJsonPath('data.summary.card_received', '50.00')
        ->assertJsonPath('data.summary.sales_count', 2)
        ->assertJsonPath('data.summary.total_sales', '130.00');
});

it('excludes reversed sales from till summary', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
        'opening_float' => 100.00,
    ]);

    // Completed sale
    $sale1 = Sale::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'cashier_id' => $user->id,
        'total' => 40.00,
        'subtotal' => 40.00,
        'status' => SaleStatus::Completed,
    ]);
    SalePayment::create([
        'sale_id' => $sale1->id,
        'method' => 'cash',
        'amount' => 40.00,
        'amount_tendered' => 40.00,
        'change_given' => 0,
    ]);

    // Reversed sale — should be excluded
    $sale2 = Sale::factory()->reversed()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'cashier_id' => $user->id,
        'total' => 200.00,
        'subtotal' => 200.00,
    ]);
    SalePayment::create([
        'sale_id' => $sale2->id,
        'method' => 'cash',
        'amount' => 200.00,
        'amount_tendered' => 200.00,
        'change_given' => 0,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 140.00,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.summary.sales_count', 1)
        ->assertJsonPath('data.summary.total_sales', '40.00')
        ->assertJsonPath('data.summary.expected_cash', '140.00')
        ->assertJsonPath('data.summary.variance', '0.00');
});

/* ------------------------------------------------------------------ */
/*  List / View                                                        */
/* ------------------------------------------------------------------ */

it('lists tills filtered by is_active', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    Till::factory()->count(2)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
    ]);
    Till::factory()->closed()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
        'closed_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/tills?filter[is_active]=1");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('filters tills by branch_id', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch1 = Branch::factory()->create(['shop_id' => $shop->id]);
    $branch2 = Branch::factory()->create(['shop_id' => $shop->id]);

    Till::factory()->count(2)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch1->id,
        'opened_by' => $user->id,
    ]);
    Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch2->id,
        'opened_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/tills?filter[branch_id]={$branch1->id}");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('shows a till with summary', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
        'opening_float' => 50.00,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/tills/{$till->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $till->id)
        ->assertJsonPath('data.name', $till->name)
        ->assertJsonStructure([
            'data' => [
                'id', 'shop_id', 'branch_id', 'name', 'is_active',
                'opening_float', 'closing_balance', 'opened_at',
                'summary' => [
                    'sales_count', 'total_sales', 'cash_received',
                    'opening_float', 'expected_cash',
                ],
            ],
        ]);
});

/* ------------------------------------------------------------------ */
/*  Authorization                                                      */
/* ------------------------------------------------------------------ */

it('allows cashier to open and close tills', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    ['user' => $cashier] = createMemberWithRole($shop, ShopRole::Cashier);

    $openResponse = $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $branch->id,
        'name' => 'Cashier Till',
        'opening_float' => 100.00,
    ]);

    $openResponse->assertCreated();

    $tillId = $openResponse->json('data.id');

    $closeResponse = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$tillId}/close", [
        'closing_balance' => 100.00,
    ]);

    $closeResponse->assertOk();
});

it('forbids viewer from opening tills', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $branch->id,
        'name' => 'Viewer Till',
    ]);

    $response->assertForbidden();
});

it('allows viewer to list tills', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $owner->id,
    ]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/tills");

    $response->assertOk();
});

it('forbids accountant from opening tills', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    createMemberWithRole($shop, ShopRole::Accountant);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/open", [
        'branch_id' => $branch->id,
        'name' => 'Accountant Till',
    ]);

    $response->assertForbidden();
});
