<?php

use ShopChain\Core\Enums\PayType;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\PaymentMethod;
use ShopChain\Core\Models\Subscription;

it('lists payment methods for owner', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    PaymentMethod::factory()->create(['user_id' => $user->id]);
    PaymentMethod::factory()->create(['user_id' => $user->id, 'is_default' => false]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/billing/payment-methods");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('adds a card payment method', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/billing/payment-methods", [
        'type' => 'card',
        'provider' => 'visa',
        'last4' => '4242',
        'display_name' => 'Visa ending 4242',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.type', 'card')
        ->assertJsonPath('data.provider', 'visa')
        ->assertJsonPath('data.last4', '4242')
        ->assertJsonPath('data.is_default', true);
});

it('adds a momo payment method', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/billing/payment-methods", [
        'type' => 'momo',
        'provider' => 'mtn',
        'display_name' => 'MTN MoMo',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.type', 'momo')
        ->assertJsonPath('data.provider', 'mtn');
});

it('first payment method becomes default', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $this->postJson("/api/v1/shops/{$shop->id}/billing/payment-methods", [
        'type' => 'card',
        'provider' => 'visa',
        'last4' => '1111',
    ])->assertCreated();

    $method = PaymentMethod::where('user_id', $user->id)->first();
    expect($method->is_default)->toBeTrue();
});

it('sets a payment method as default', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $method1 = PaymentMethod::factory()->create(['user_id' => $user->id, 'is_default' => true]);
    $method2 = PaymentMethod::factory()->create(['user_id' => $user->id, 'is_default' => false]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/billing/payment-methods/{$method2->id}");

    $response->assertOk()
        ->assertJsonPath('data.is_default', true);

    expect($method1->fresh()->is_default)->toBeFalse();
});

it('removes a payment method', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $method = PaymentMethod::factory()->create(['user_id' => $user->id]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/billing/payment-methods/{$method->id}");

    $response->assertNoContent();
    expect(PaymentMethod::find($method->id))->toBeNull();
});

it('cannot remove last payment method with active paid subscription', function () {
    ['shop' => $shop, 'user' => $user] = createOwnerWithShop();

    $method = PaymentMethod::factory()->create(['user_id' => $user->id]);

    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
        'auto_renew' => true,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/billing/payment-methods/{$method->id}");

    $response->assertStatus(500); // InvalidArgumentException from service
});
