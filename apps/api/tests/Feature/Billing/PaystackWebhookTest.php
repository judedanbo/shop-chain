<?php

use ShopChain\Core\Enums\BillingStatus;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\BillingRecord;
use ShopChain\Core\Models\Subscription;

beforeEach(function () {
    config(['services.paystack.secret' => 'test-secret']);
});

it('accepts webhook with valid signature', function () {
    seedPermissionsAndPlans();

    $user = \App\Models\User::factory()->create();
    $shop = \ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $user->id]);

    $sub = Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
        'auto_renew' => true,
    ]);

    $record = BillingRecord::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'subscription_id' => $sub->id,
        'amount' => 49.00,
        'status' => BillingStatus::Pending,
        'tx_ref' => 'test_webhook_ref',
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => ['reference' => 'test_webhook_ref'],
    ]);

    $secret = config('services.paystack.secret');
    $signature = hash_hmac('sha512', $payload, $secret);

    $response = $this->postJson('/api/v1/webhooks/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ]);

    $response->assertOk();
    expect($record->fresh()->status)->toBe(BillingStatus::Paid);
});

it('rejects webhook with invalid signature', function () {
    $payload = json_encode([
        'event' => 'charge.success',
        'data' => ['reference' => 'test_ref'],
    ]);

    $response = $this->postJson('/api/v1/webhooks/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => 'invalid-signature',
    ]);

    $response->assertForbidden();
});

it('handles charge.success and marks billing record as paid', function () {
    seedPermissionsAndPlans();

    $user = \App\Models\User::factory()->create();
    $shop = \ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $user->id]);

    $sub = Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::PastDue,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
        'auto_renew' => true,
    ]);

    BillingRecord::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'subscription_id' => $sub->id,
        'amount' => 49.00,
        'status' => BillingStatus::Pending,
        'tx_ref' => 'success_ref',
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => ['reference' => 'success_ref'],
    ]);

    $secret = config('services.paystack.secret');
    $signature = hash_hmac('sha512', $payload, $secret);

    $this->postJson('/api/v1/webhooks/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertOk();

    expect($sub->fresh()->status)->toBe(SubscriptionStatus::Active);
});

it('handles charge.failed and marks billing record as failed', function () {
    seedPermissionsAndPlans();

    $user = \App\Models\User::factory()->create();
    $shop = \ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $user->id]);

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
        'status' => BillingStatus::Pending,
        'tx_ref' => 'fail_ref',
    ]);

    $payload = json_encode([
        'event' => 'charge.failed',
        'data' => ['reference' => 'fail_ref'],
    ]);

    $secret = config('services.paystack.secret');
    $signature = hash_hmac('sha512', $payload, $secret);

    $this->postJson('/api/v1/webhooks/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertOk();

    $record = BillingRecord::withoutGlobalScopes()->where('tx_ref', 'fail_ref')->first();
    expect($record->status)->toBe(BillingStatus::Failed);
    expect($sub->fresh()->status)->toBe(SubscriptionStatus::PastDue);
});

it('returns ok for unhandled events', function () {
    $payload = json_encode([
        'event' => 'transfer.success',
        'data' => ['reference' => 'some_ref'],
    ]);

    $secret = config('services.paystack.secret');
    $signature = hash_hmac('sha512', $payload, $secret);

    $response = $this->postJson('/api/v1/webhooks/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ]);

    $response->assertOk();
});
