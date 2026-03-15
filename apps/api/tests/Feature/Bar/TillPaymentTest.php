<?php

use ShopChain\Core\Enums\KitchenOrderStatus;
use ShopChain\Core\Enums\SaleSource;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\KitchenOrder;
use ShopChain\Core\Models\KitchenOrderItem;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Till;
use ShopChain\Core\Models\TillPayment;

/* ------------------------------------------------------------------ */
/*  Payment Recording                                                  */
/* ------------------------------------------------------------------ */

it('records a cash payment for a served order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
        'total' => 50.00,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'cash',
        'amount' => 50.00,
        'amount_tendered' => 50.00,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.method', 'cash')
        ->assertJsonPath('data.amount', '50.00')
        ->assertJsonPath('data.amount_tendered', '50.00')
        ->assertJsonPath('data.change_given', '0.00');

    expect($response->json('data.paid_at'))->not->toBeNull();
});

it('records a card payment with card details', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->completed()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'card',
        'amount' => 35.00,
        'card_type' => 'Visa',
        'card_trans_no' => 'TXN-1234',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.method', 'card')
        ->assertJsonPath('data.card_type', 'Visa')
        ->assertJsonPath('data.card_trans_no', 'TXN-1234');
});

it('records a momo payment with provider details', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'momo',
        'amount' => 25.00,
        'momo_provider' => 'MTN',
        'momo_phone' => '0231234567',
        'momo_trans_id' => 'MOMO-5678',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.method', 'momo')
        ->assertJsonPath('data.momo_provider', 'MTN')
        ->assertJsonPath('data.momo_phone', '0231234567')
        ->assertJsonPath('data.momo_trans_id', 'MOMO-5678');
});

it('calculates change_given for cash overpayment', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'cash',
        'amount' => 30.00,
        'amount_tendered' => 50.00,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.amount', '30.00')
        ->assertJsonPath('data.amount_tendered', '50.00')
        ->assertJsonPath('data.change_given', '20.00');
});

it('rejects payment on a closed till', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->closed()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
        'closed_by' => $user->id,
    ]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'cash',
        'amount' => 20.00,
        'amount_tendered' => 20.00,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['till']);
});

it('rejects payment for a pending order', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'cash',
        'amount' => 20.00,
        'amount_tendered' => 20.00,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['order_id']);
});

it('rejects payment for order not on this till', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till1 = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $till2 = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till2->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till1->id}/payments", [
        'order_id' => $order->id,
        'method' => 'cash',
        'amount' => 20.00,
        'amount_tendered' => 20.00,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['order_id']);
});

/* ------------------------------------------------------------------ */
/*  Payment Listing                                                    */
/* ------------------------------------------------------------------ */

it('lists payments for a till', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    TillPayment::factory()->count(3)->create([
        'till_id' => $till->id,
        'order_id' => $order->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments");

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('filters payments by method', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    TillPayment::factory()->count(2)->create(['till_id' => $till->id, 'order_id' => $order->id]);
    TillPayment::factory()->card()->create(['till_id' => $till->id, 'order_id' => $order->id]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments?filter[method]=cash");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

/* ------------------------------------------------------------------ */
/*  Enhanced Till Close                                                */
/* ------------------------------------------------------------------ */

it('closing till aggregates kitchen orders into a bar sale', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'opened_by' => $user->id,
        'opening_float' => 100.00,
    ]);

    $product1 = Product::factory()->create(['shop_id' => $shop->id, 'price' => 20.00]);
    $product2 = Product::factory()->create(['shop_id' => $shop->id, 'price' => 30.00]);

    // Two served orders
    $order1 = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
        'total' => 40.00,
    ]);
    KitchenOrderItem::factory()->create(['order_id' => $order1->id, 'product_id' => $product1->id, 'quantity' => 2]);

    $order2 = KitchenOrder::factory()->completed()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
        'total' => 30.00,
    ]);
    KitchenOrderItem::factory()->create(['order_id' => $order2->id, 'product_id' => $product2->id, 'quantity' => 1]);

    // Record payments
    TillPayment::factory()->create(['till_id' => $till->id, 'order_id' => $order1->id, 'amount' => 40.00, 'amount_tendered' => 50.00, 'change_given' => 10.00]);
    TillPayment::factory()->card()->create(['till_id' => $till->id, 'order_id' => $order2->id, 'amount' => 30.00]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 130.00,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.is_active', false);

    // Aggregated bar sale should exist
    $sale = Sale::where('till_id', $till->id)->where('source', 'bar')->first();
    expect($sale)->not->toBeNull()
        ->and($sale->source)->toBe(SaleSource::Bar)
        ->and($sale->status->value)->toBe('completed')
        ->and((float) $sale->subtotal)->toBe(70.00)
        ->and((float) $sale->total)->toBe(70.00);

    // Sale items created
    expect($sale->items)->toHaveCount(2);

    // Sale payments created from till payments
    expect($sale->payments)->toHaveCount(2);
});

it('creates sale payments from till payments on close', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);

    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
        'total' => 25.00,
    ]);
    KitchenOrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => Product::factory()->create(['shop_id' => $shop->id, 'price' => 25.00])->id,
        'quantity' => 1,
    ]);

    TillPayment::factory()->momo()->create([
        'till_id' => $till->id,
        'order_id' => $order->id,
        'amount' => 25.00,
        'momo_provider' => 'MTN',
        'momo_phone' => '0231234567',
        'momo_trans_id' => 'MOMO-9999',
    ]);

    $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 0,
    ])->assertOk();

    $sale = Sale::where('till_id', $till->id)->where('source', 'bar')->first();
    $payment = $sale->payments->first();

    expect($payment->method->value)->toBe('momo')
        ->and((float) $payment->amount)->toBe(25.00)
        ->and($payment->momo_provider)->toBe('MTN')
        ->and($payment->momo_ref)->toBe('MOMO-9999');
});

it('links kitchen orders to aggregated sale on close', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);

    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
        'total' => 15.00,
    ]);
    KitchenOrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => Product::factory()->create(['shop_id' => $shop->id])->id,
        'quantity' => 1,
    ]);

    $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 0,
    ])->assertOk();

    $order->refresh();
    expect($order->sale_id)->not->toBeNull();

    $sale = Sale::find($order->sale_id);
    expect($sale->source)->toBe(SaleSource::Bar);
});

it('rejects closing till with unresolved orders', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);

    // Pending order — unresolved
    KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 100.00,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['till']);
});

it('creates no sale when only rejected and cancelled orders exist', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);

    KitchenOrder::factory()->rejected()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);
    KitchenOrder::factory()->cancelled()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/close", [
        'closing_balance' => 0,
    ]);

    $response->assertOk();

    expect(Sale::where('till_id', $till->id)->where('source', 'bar')->count())->toBe(0);
});

/* ------------------------------------------------------------------ */
/*  Table Number Filter                                                */
/* ------------------------------------------------------------------ */

it('filters kitchen orders by table_number', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $user->id]);

    KitchenOrder::factory()->count(2)->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
        'table_number' => 'Table 5',
    ]);
    KitchenOrder::factory()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $user->id,
        'table_number' => 'Table 12',
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/kitchen-orders?filter[table_number]=Table 5");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

/* ------------------------------------------------------------------ */
/*  Authorization                                                      */
/* ------------------------------------------------------------------ */

it('allows bar_manager to record till payments', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    ['user' => $barManager] = createMemberWithRole($shop, ShopRole::BarManager);

    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $barManager->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $barManager->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'cash',
        'amount' => 20.00,
        'amount_tendered' => 20.00,
    ]);

    $response->assertCreated();
});

it('allows waiter to record till payments', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    ['user' => $waiter] = createMemberWithRole($shop, ShopRole::Waiter);

    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $waiter->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $waiter->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'cash',
        'amount' => 15.00,
        'amount_tendered' => 15.00,
    ]);

    $response->assertCreated();
});

it('forbids viewer from recording till payments', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);
    $till = Till::factory()->create(['shop_id' => $shop->id, 'branch_id' => $branch->id, 'opened_by' => $owner->id]);
    $order = KitchenOrder::factory()->served()->create([
        'shop_id' => $shop->id,
        'branch_id' => $branch->id,
        'till_id' => $till->id,
        'server_id' => $owner->id,
    ]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/tills/{$till->id}/payments", [
        'order_id' => $order->id,
        'method' => 'cash',
        'amount' => 10.00,
        'amount_tendered' => 10.00,
    ]);

    $response->assertForbidden();
});
