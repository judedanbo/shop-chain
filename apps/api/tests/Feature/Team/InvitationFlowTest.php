<?php

use App\Models\User;
use App\Notifications\TeamInviteNotification;
use Illuminate\Support\Facades\Notification;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\UserStatus;
use ShopChain\Core\Models\ShopMember;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function createPasswordGrantClient(): void
{
    $clients = app(ClientRepository::class);
    $client = $clients->createPasswordGrantClient('ShopChain Test');

    config([
        'passport.password_client.id' => $client->getKey(),
        'passport.password_client.secret' => $client->plainSecret,
    ]);
}

function inviteNewMember(string $shopId, array $overrides = []): \Illuminate\Testing\TestResponse
{
    return test()->postJson("/api/v1/shops/{$shopId}/team/invite", array_merge([
        'name' => 'Invited User',
        'email' => 'invited@example.com',
        'role' => ShopRole::Cashier->value,
    ], $overrides));
}

/* ------------------------------------------------------------------ */
/*  Invite sends email                                                 */
/* ------------------------------------------------------------------ */

it('generates invite token, expiry, and invited_by on invite', function () {
    ['shop' => $shop, 'user' => $owner] = createOwnerWithShop();
    Notification::fake();

    $response = inviteNewMember($shop->id);
    $response->assertCreated();

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    expect($member->invite_token)->toBeString()->toHaveLength(64)
        ->and($member->invite_expires_at)->not->toBeNull()
        ->and($member->invite_expires_at->isFuture())->toBeTrue()
        ->and($member->invited_by)->toBe($owner->id);
});

it('sends TeamInviteNotification email on invite', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $invitedUser = User::where('email', 'invited@example.com')->first();
    Notification::assertSentTo($invitedUser, TeamInviteNotification::class);
});

it('does not send notification when validation fails', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    // Missing required fields
    $response = test()->postJson("/api/v1/shops/{$shop->id}/team/invite", []);
    $response->assertUnprocessable();

    Notification::assertNothingSent();
});

/* ------------------------------------------------------------------ */
/*  View invite — public                                               */
/* ------------------------------------------------------------------ */

it('shows invite details for valid token', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    // Act as guest (no auth)
    Passport::actingAs(User::factory()->create());
    $this->app['auth']->forgetGuards();

    $response = $this->getJson("/api/v1/invite/{$member->invite_token}");

    $response->assertOk()
        ->assertJsonPath('shop_name', $shop->name)
        ->assertJsonPath('role', ShopRole::Cashier->value)
        ->assertJsonPath('email', 'invited@example.com')
        ->assertJsonPath('requires_password', true);
});

it('returns 404 for invalid token', function () {
    $response = $this->getJson('/api/v1/invite/nonexistent-token');

    $response->assertNotFound();
});

it('returns 410 for expired invite', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    // Manually expire the invite
    $member->update(['invite_expires_at' => now()->subDay()]);

    $response = $this->getJson("/api/v1/invite/{$member->invite_token}");

    $response->assertStatus(410);
});

it('returns 410 for already-accepted invite', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    // Manually accept the invite
    $token = $member->invite_token;
    $member->update([
        'status' => MemberStatus::Active,
        'invite_token' => null,
    ]);

    $response = $this->getJson("/api/v1/invite/{$token}");

    $response->assertNotFound();
});

/* ------------------------------------------------------------------ */
/*  Accept — new user                                                  */
/* ------------------------------------------------------------------ */

it('accepts invite with password for new user', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();
    createPasswordGrantClient();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    // Act as guest
    $this->app['auth']->forgetGuards();

    $response = $this->postJson("/api/v1/invite/{$member->invite_token}/accept", [
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['member', 'user', 'access_token', 'refresh_token']);

    $member->refresh();
    expect($member->status)->toBe(MemberStatus::Active)
        ->and($member->joined_at)->not->toBeNull()
        ->and($member->invite_token)->toBeNull()
        ->and($member->invite_expires_at)->toBeNull();
});

it('requires password for new user on accept', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    $this->app['auth']->forgetGuards();

    $response = $this->postJson("/api/v1/invite/{$member->invite_token}/accept", []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('rejects short password on accept', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    $this->app['auth']->forgetGuards();

    $response = $this->postJson("/api/v1/invite/{$member->invite_token}/accept", [
        'password' => 'short',
        'password_confirmation' => 'short',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('returns Passport tokens after accepting as new user', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();
    createPasswordGrantClient();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    $this->app['auth']->forgetGuards();

    $response = $this->postJson("/api/v1/invite/{$member->invite_token}/accept", [
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'access_token',
            'refresh_token',
            'token_type',
            'expires_in',
        ]);
});

/* ------------------------------------------------------------------ */
/*  Accept — existing user                                             */
/* ------------------------------------------------------------------ */

it('accepts invite without password for existing user', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    $existingUser = User::factory()->create([
        'email' => 'existing@example.com',
        'last_active_at' => now(),
        'status' => UserStatus::Active,
    ]);

    inviteNewMember($shop->id, [
        'name' => $existingUser->name,
        'email' => $existingUser->email,
    ]);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->where('user_id', $existingUser->id)
        ->first();

    $this->app['auth']->forgetGuards();

    $response = $this->postJson("/api/v1/invite/{$member->invite_token}/accept");

    $response->assertOk()
        ->assertJsonMissing(['access_token']);

    $member->refresh();
    expect($member->status)->toBe(MemberStatus::Active)
        ->and($member->joined_at)->not->toBeNull();
});

it('rejects accept for expired invite', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    $member->update(['invite_expires_at' => now()->subDay()]);

    $this->app['auth']->forgetGuards();

    $response = $this->postJson("/api/v1/invite/{$member->invite_token}/accept", [
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['token']);
});

it('rejects accept for already-accepted invite', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    $token = $member->invite_token;
    $member->update(['status' => MemberStatus::Active, 'invite_token' => null]);

    $this->app['auth']->forgetGuards();

    $response = $this->postJson("/api/v1/invite/{$token}/accept", [
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['token']);
});

/* ------------------------------------------------------------------ */
/*  Resend invite                                                      */
/* ------------------------------------------------------------------ */

it('resends invite and regenerates token', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    $originalToken = $member->invite_token;

    // Reset notification fake to check for new notification
    Notification::fake();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/{$member->id}/resend-invite");

    $response->assertOk();

    $member->refresh();
    expect($member->invite_token)->not->toBe($originalToken)
        ->and($member->invite_token)->toHaveLength(64);

    $invitedUser = User::where('email', 'invited@example.com')->first();
    Notification::assertSentTo($invitedUser, TeamInviteNotification::class);
});

it('rejects resend for non-invited member', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $memberUser = User::factory()->create();
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/{$member->id}/resend-invite");

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['member']);
});

it('requires team.manage permission to resend invite', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    // Switch to viewer (no team.manage)
    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/{$member->id}/resend-invite");

    $response->assertForbidden();
});

/* ------------------------------------------------------------------ */
/*  Cancel invite                                                      */
/* ------------------------------------------------------------------ */

it('cancels pending invite', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/{$member->id}/cancel-invite");

    $response->assertNoContent();

    $member->refresh();
    expect($member->status)->toBe(MemberStatus::Removed)
        ->and($member->invite_token)->toBeNull()
        ->and($member->invite_expires_at)->toBeNull()
        ->and($member->user->hasRole('cashier'))->toBeFalse();
});

it('rejects cancel for non-invited member', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $memberUser = User::factory()->create();
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/{$member->id}/cancel-invite");

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['member']);
});

it('requires team.manage permission to cancel invite', function () {
    ['shop' => $shop] = createOwnerWithShop();
    Notification::fake();

    inviteNewMember($shop->id);

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'invited@example.com'))
        ->first();

    // Switch to viewer (no team.manage)
    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/{$member->id}/cancel-invite");

    $response->assertForbidden();
});
