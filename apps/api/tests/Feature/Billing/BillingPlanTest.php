<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Subscription;

it('returns current plan and usage for shop owner', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/plan");

    $response->assertOk()
        ->assertJsonPath('plan.id', 'free')
        ->assertJsonStructure([
            'plan' => ['id', 'name', 'price', 'limits', 'features'],
            'usage',
            'is_trial',
            'days_remaining',
        ]);
});

it('returns free plan when no active subscription', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/plan");

    $response->assertOk()
        ->assertJsonPath('plan.id', 'free')
        ->assertJsonPath('subscription', null)
        ->assertJsonPath('is_trial', false);
});

it('shows trial status correctly', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addDays(14),
        'auto_renew' => false,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/plan");

    $response->assertOk()
        ->assertJsonPath('plan.id', 'basic')
        ->assertJsonPath('is_trial', true)
        ->assertJsonPath('subscription.status', 'active');
});

it('forbids non-owner from billing endpoints', function () {
    ['shop' => $shop] = createOwnerWithShop();
    createMemberWithRole($shop, ShopRole::Manager);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/plan");

    $response->assertForbidden();
});

it('shows active subscription with plan details', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now()->subDays(5),
        'expires_at' => now()->addDays(25),
        'auto_renew' => true,
    ]);

    // Create a billing record so it's not a trial
    \ShopChain\Core\Models\BillingRecord::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'subscription_id' => Subscription::withoutGlobalScopes()->first()->id,
        'amount' => 49.00,
        'status' => \ShopChain\Core\Enums\BillingStatus::Paid,
        'tx_ref' => 'test_ref_123',
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/plan");

    $response->assertOk()
        ->assertJsonPath('plan.id', 'basic')
        ->assertJsonPath('is_trial', false)
        ->assertJsonPath('subscription.auto_renew', true);
});

it('returns usage data with plan', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/plan");

    $response->assertOk()
        ->assertJsonStructure([
            'usage' => [
                '*' => ['key', 'label', 'used', 'max', 'unlimited', 'pct', 'warning', 'blocked'],
            ],
        ]);
});
