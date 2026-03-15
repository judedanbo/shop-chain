<?php

use ShopChain\Core\Models\NotificationPreference;

/* ------------------------------------------------------------------ */
/*  Preferences                                                        */
/* ------------------------------------------------------------------ */

it('returns default preferences for new user', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $response = $this->getJson("/api/v1/shops/{$shop->id}/notifications/preferences");

    $response->assertSuccessful()
        ->assertJsonPath('data.user_id', $user->id)
        ->assertJsonPath('data.quiet_hours_enabled', false);

    expect($response->json('data.categories'))->not->toBeEmpty();
});

it('updates category preferences', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/notifications/preferences", [
        'categories' => [
            'stock_alert' => ['enabled' => false, 'channels' => ['in_app']],
            'sale_event' => ['enabled' => true, 'channels' => ['in_app', 'push']],
        ],
    ]);

    $response->assertSuccessful();

    $prefs = NotificationPreference::where('user_id', $user->id)->first();
    expect($prefs->categories['stock_alert']['enabled'])->toBeFalse()
        ->and($prefs->categories['sale_event']['enabled'])->toBeTrue();
});

it('updates quiet hours settings', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/notifications/preferences", [
        'quiet_hours_enabled' => true,
        'quiet_hours_start' => '23:00',
        'quiet_hours_end' => '06:00',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.quiet_hours_enabled', true)
        ->assertJsonPath('data.quiet_hours_start', '23:00:00')
        ->assertJsonPath('data.quiet_hours_end', '06:00:00');
});

it('validates channel enum values', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/notifications/preferences", [
        'categories' => [
            'stock_alert' => ['enabled' => true, 'channels' => ['invalid_channel']],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['categories.stock_alert.channels.0']);
});
