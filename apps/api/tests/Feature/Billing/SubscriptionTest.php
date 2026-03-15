<?php

use ShopChain\Core\Enums\BillingStatus;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\BillingRecord;
use ShopChain\Core\Models\Subscription;

it('upgrades from free to basic and creates subscription', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/billing/upgrade", [
        'plan_id' => 'basic',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.plan.id', 'basic')
        ->assertJsonPath('data.status', 'active');

    $sub = Subscription::withoutGlobalScopes()->where('shop_id', $shop->id)->first();
    expect($sub)->not->toBeNull()
        ->and($sub->plan_id)->toBe('basic')
        ->and($sub->status)->toBe(SubscriptionStatus::Active);
});

it('creates a billing record on upgrade to paid plan', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $this->postJson("/api/v1/shops/{$shop->id}/billing/upgrade", [
        'plan_id' => 'basic',
    ])->assertCreated();

    $record = BillingRecord::withoutGlobalScopes()->where('shop_id', $shop->id)->first();
    expect($record)->not->toBeNull()
        ->and($record->status)->toBe(BillingStatus::Pending);
});

it('cannot upgrade to same plan', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // First upgrade to basic
    $this->postJson("/api/v1/shops/{$shop->id}/billing/upgrade", [
        'plan_id' => 'basic',
    ])->assertCreated();

    // Try to upgrade to basic again
    $response = $this->postJson("/api/v1/shops/{$shop->id}/billing/upgrade", [
        'plan_id' => 'basic',
    ]);

    $response->assertStatus(500); // InvalidArgumentException
});

it('upgrades from basic to max immediately', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // First subscribe to basic
    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now()->subDays(10),
        'expires_at' => now()->addDays(20),
        'auto_renew' => true,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/billing/upgrade", [
        'plan_id' => 'max',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.plan.id', 'max');

    $sub = Subscription::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->where('status', SubscriptionStatus::Active)
        ->first();
    expect($sub->plan_id)->toBe('max');
});

it('cancels subscription and keeps access until period end', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
        'auto_renew' => true,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/billing/cancel");

    $response->assertOk()
        ->assertJsonPath('data.status', 'active'); // still active until expires_at

    $sub = Subscription::withoutGlobalScopes()->where('shop_id', $shop->id)->first();
    expect($sub->cancelled_at)->not->toBeNull()
        ->and($sub->auto_renew)->toBeFalse();
});

it('returns error when cancelling without active subscription', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/billing/cancel");

    $response->assertUnprocessable();
});

it('only allows one active subscription per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
        'auto_renew' => true,
    ]);

    // Attempting subscribe again should change plan, not create a second sub
    $this->postJson("/api/v1/shops/{$shop->id}/billing/upgrade", [
        'plan_id' => 'max',
    ])->assertCreated();

    $activeCount = Subscription::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->where('status', SubscriptionStatus::Active)
        ->count();
    expect($activeCount)->toBe(1);
});

it('expired subscription falls back to free plan', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Expired,
        'started_at' => now()->subDays(30),
        'expires_at' => now()->subDay(),
        'auto_renew' => false,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/plan");

    $response->assertOk()
        ->assertJsonPath('plan.id', 'free')
        ->assertJsonPath('subscription', null);
});

it('shows billing history paginated', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $sub = Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
        'auto_renew' => true,
    ]);

    BillingRecord::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'subscription_id' => $sub->id,
        'amount' => 49.00,
        'status' => BillingStatus::Paid,
        'tx_ref' => 'test_001',
    ]);
    BillingRecord::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'subscription_id' => $sub->id,
        'amount' => 49.00,
        'status' => BillingStatus::Paid,
        'tx_ref' => 'test_002',
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/history");

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'amount', 'status', 'tx_ref', 'created_at'],
            ],
        ]);
});

it('validates plan_id on upgrade', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/billing/upgrade", [
        'plan_id' => 'nonexistent',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['plan_id']);
});
