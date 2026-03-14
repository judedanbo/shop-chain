<?php

use ShopChain\Core\Enums\ShopRole;

it('reads shop settings', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->getJson("/api/v1/shops/{$shop->id}/settings");

    $response->assertSuccessful()
        ->assertJsonStructure([
            'data' => ['currency', 'timezone', 'tax_rate', 'tax_label', 'receipt_footer', 'low_stock_threshold'],
        ]);
});

it('updates shop settings', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/settings", [
        'currency' => 'USD',
        'timezone' => 'UTC',
        'tax_rate' => 12.5,
        'tax_label' => 'VAT',
        'receipt_footer' => 'Thank you!',
        'low_stock_threshold' => 10,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.currency', 'USD')
        ->assertJsonPath('data.timezone', 'UTC')
        ->assertJsonPath('data.tax_label', 'VAT')
        ->assertJsonPath('data.receipt_footer', 'Thank you!')
        ->assertJsonPath('data.low_stock_threshold', 10);
});

it('rejects invalid timezone', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/settings", [
        'timezone' => 'Invalid/Timezone',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['timezone']);
});

it('rejects negative tax rate', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/settings", [
        'tax_rate' => -5,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['tax_rate']);
});

it('rejects tax rate over 100', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/settings", [
        'tax_rate' => 150,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['tax_rate']);
});

it('requires settings.edit permission to update settings', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/settings", [
        'currency' => 'USD',
    ]);

    $response->assertForbidden();
});

it('rejects currency with wrong length', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/settings", [
        'currency' => 'US',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['currency']);
});
