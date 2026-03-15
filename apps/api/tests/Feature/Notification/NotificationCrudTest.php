<?php

use App\Models\User;
use ShopChain\Core\Enums\NotifAction;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Models\Notification;

/* ------------------------------------------------------------------ */
/*  Index / List                                                       */
/* ------------------------------------------------------------------ */

it('lists notifications for authenticated user', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    Notification::factory()->count(3)->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
    ]);

    // Create notification for another user (should not appear)
    $otherUser = User::factory()->create();
    Notification::factory()->create([
        'user_id' => $otherUser->id,
        'shop_id' => $shop->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/notifications");

    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('filters notifications by category', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    Notification::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'category' => NotifCategory::StockAlert,
    ]);
    Notification::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'category' => NotifCategory::SaleEvent,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/notifications?filter[category]=stock_alert");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.category', 'stock_alert');
});

it('filters notifications by read status', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    Notification::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'is_read' => false,
    ]);
    Notification::factory()->read()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/notifications?filter[is_read]=0");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('filters notifications by priority', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    Notification::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'priority' => NotifPriority::High,
    ]);
    Notification::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'priority' => NotifPriority::Low,
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/notifications?filter[priority]=high");

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

/* ------------------------------------------------------------------ */
/*  Mark As Read                                                       */
/* ------------------------------------------------------------------ */

it('marks notification as read', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $notification = Notification::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'is_read' => false,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/notifications/{$notification->id}/read");

    $response->assertSuccessful()
        ->assertJsonPath('data.is_read', true);

    expect($notification->fresh()->is_read)->toBeTrue();
});

it('marks all notifications as read', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    Notification::factory()->count(3)->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'is_read' => false,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/notifications/mark-all-read");

    $response->assertSuccessful()
        ->assertJsonPath('marked_read', 3);

    $unread = Notification::where('user_id', $user->id)->where('is_read', false)->count();
    expect($unread)->toBe(0);
});

/* ------------------------------------------------------------------ */
/*  Delete                                                             */
/* ------------------------------------------------------------------ */

it('deletes a notification', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $notification = Notification::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/notifications/{$notification->id}");

    $response->assertNoContent();

    expect(Notification::find($notification->id))->toBeNull();
});

/* ------------------------------------------------------------------ */
/*  Access Control                                                     */
/* ------------------------------------------------------------------ */

it('denies access to another user notification', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $otherUser = User::factory()->create();
    $notification = Notification::factory()->create([
        'user_id' => $otherUser->id,
        'shop_id' => $shop->id,
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/notifications/{$notification->id}/read");

    $response->assertForbidden();
});

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

it('takes action on actionable notification', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $notification = Notification::factory()->actionable()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/notifications/{$notification->id}/action", [
        'action' => NotifAction::Approved->value,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.action_taken', NotifAction::Approved->value);
});

it('rejects action on non-actionable notification', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $notification = Notification::factory()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'requires_action' => false,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/notifications/{$notification->id}/action", [
        'action' => NotifAction::Approved->value,
    ]);

    $response->assertForbidden();
});

it('rejects action on already actioned notification', function () {
    ['user' => $user, 'shop' => $shop] = createOwnerWithShop();

    $notification = Notification::factory()->actionable()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'action_taken' => NotifAction::Approved,
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/notifications/{$notification->id}/action", [
        'action' => NotifAction::Rejected->value,
    ]);

    $response->assertForbidden();
});
