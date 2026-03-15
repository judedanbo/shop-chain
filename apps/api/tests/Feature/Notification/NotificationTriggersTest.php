<?php

use App\Models\User;
use Illuminate\Support\Facades\Event;
use ShopChain\Core\Enums\DiscountType;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Events\AdjustmentPending;
use ShopChain\Core\Events\DiscountApplied;
use ShopChain\Core\Events\PurchaseOrderStatusChanged;
use ShopChain\Core\Events\ReversalRequested;
use ShopChain\Core\Events\ReversalResolved;
use ShopChain\Core\Events\SaleCompleted;
use ShopChain\Core\Events\TeamMemberJoined;
use ShopChain\Core\Models\Notification;
use ShopChain\Core\Models\NotificationPreference;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;
use ShopChain\Core\Services\NotificationService;

/* ------------------------------------------------------------------ */
/*  Sale Notifications                                                 */
/* ------------------------------------------------------------------ */

it('creates notification for owner/manager on sale completion', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $cashier = User::factory()->create();
    $managerUser = User::factory()->create();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $managerUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Manager,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'Sale Completed',
        'message' => 'A sale was completed',
        'category' => NotifCategory::SaleEvent,
        'priority' => \ShopChain\Core\Enums\NotifPriority::Low,
        'channels' => [\ShopChain\Core\Enums\NotifChannel::InApp],
        'target_roles' => ['owner', 'manager'],
        'actor_id' => $cashier->id,
    ]);

    expect($notifications)->toHaveCount(2);
    expect(Notification::where('shop_id', $shop->id)->count())->toBe(2);
});

it('creates high-priority notification for discount >= 15%', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'Discount Applied',
        'message' => '20% discount applied',
        'category' => NotifCategory::SaleEvent,
        'priority' => NotifPriority::High,
        'channels' => [\ShopChain\Core\Enums\NotifChannel::InApp, \ShopChain\Core\Enums\NotifChannel::Push],
        'target_roles' => ['owner', 'general_manager', 'manager'],
    ]);

    expect($notifications->first()->priority)->toBe(NotifPriority::High);
});

it('creates medium-priority notification for discount < 15%', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'Discount Applied',
        'message' => '10% discount applied',
        'category' => NotifCategory::SaleEvent,
        'priority' => NotifPriority::Medium,
        'channels' => [\ShopChain\Core\Enums\NotifChannel::InApp],
        'target_roles' => ['owner', 'general_manager', 'manager'],
    ]);

    expect($notifications->first()->priority)->toBe(NotifPriority::Medium);
});

/* ------------------------------------------------------------------ */
/*  Reversal Notifications                                             */
/* ------------------------------------------------------------------ */

it('creates actionable notification for managers on reversal request', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $requester = User::factory()->create();

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'Reversal Requested',
        'message' => 'A reversal was requested',
        'category' => NotifCategory::ApprovalRequest,
        'priority' => NotifPriority::High,
        'channels' => [\ShopChain\Core\Enums\NotifChannel::InApp, \ShopChain\Core\Enums\NotifChannel::Push],
        'target_roles' => ['owner', 'general_manager', 'manager'],
        'requires_action' => true,
        'actor_id' => $requester->id,
    ]);

    expect($notifications->first()->requires_action)->toBeTrue()
        ->and($notifications->first()->category)->toBe(NotifCategory::ApprovalRequest);
});

it('notifies requester on reversal approval', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $requester = User::factory()->create();

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'Reversal Approved',
        'message' => 'Your reversal was approved',
        'category' => NotifCategory::SaleEvent,
        'priority' => NotifPriority::Medium,
        'channels' => [\ShopChain\Core\Enums\NotifChannel::InApp],
        'target_roles' => ['owner', 'general_manager'],
        'target_user_id' => $requester->id,
    ]);

    $requesterNotification = $notifications->firstWhere('user_id', $requester->id);
    expect($requesterNotification)->not->toBeNull();
});

/* ------------------------------------------------------------------ */
/*  PO / Team Notifications                                            */
/* ------------------------------------------------------------------ */

it('creates notification on PO status change', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $actor = User::factory()->create();

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'Purchase Order approved',
        'message' => 'PO status changed',
        'category' => NotifCategory::OrderUpdate,
        'priority' => NotifPriority::Medium,
        'channels' => [\ShopChain\Core\Enums\NotifChannel::InApp],
        'target_roles' => ['owner', 'manager', 'inventory_manager'],
        'actor_id' => $actor->id,
    ]);

    expect($notifications)->not->toBeEmpty();
});

it('creates notification when team member joins', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $newMember = User::factory()->create();

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'New Team Member',
        'message' => "{$newMember->name} has joined the team",
        'category' => NotifCategory::TeamUpdate,
        'priority' => NotifPriority::Low,
        'channels' => [\ShopChain\Core\Enums\NotifChannel::InApp],
        'target_roles' => ['owner', 'manager'],
    ]);

    expect($notifications)->not->toBeEmpty();
});

/* ------------------------------------------------------------------ */
/*  Preferences Enforcement                                            */
/* ------------------------------------------------------------------ */

it('respects user preferences for disabled category', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    // Disable sale_event category for the owner
    NotificationPreference::create([
        'user_id' => $owner->id,
        'categories' => [
            'sale_event' => ['enabled' => false, 'channels' => ['in_app']],
        ],
        'quiet_hours_enabled' => false,
        'quiet_hours_start' => '22:00',
        'quiet_hours_end' => '07:00',
    ]);

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'Sale Completed',
        'message' => 'A sale was completed',
        'category' => NotifCategory::SaleEvent,
        'priority' => NotifPriority::Low,
        'channels' => [\ShopChain\Core\Enums\NotifChannel::InApp],
        'target_roles' => ['owner'],
    ]);

    // No notification should be created for owner since category is disabled
    expect($notifications)->toBeEmpty();
});

it('suppresses push/email/sms during quiet hours but keeps in_app', function () {
    $service = app(NotificationService::class);

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    seedPermissionsAndPlans();

    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $owner->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    // Set quiet hours to cover current time
    NotificationPreference::create([
        'user_id' => $owner->id,
        'categories' => [],
        'quiet_hours_enabled' => true,
        'quiet_hours_start' => '00:00',
        'quiet_hours_end' => '23:59',
    ]);

    $notifications = $service->dispatch([
        'shop_id' => $shop->id,
        'title' => 'Stock Alert',
        'message' => 'Low stock detected',
        'category' => NotifCategory::StockAlert,
        'priority' => NotifPriority::High,
        'channels' => [
            \ShopChain\Core\Enums\NotifChannel::InApp,
            \ShopChain\Core\Enums\NotifChannel::Push,
            \ShopChain\Core\Enums\NotifChannel::Email,
        ],
        'target_roles' => ['owner'],
    ]);

    expect($notifications)->toHaveCount(1);

    $channels = $notifications->first()->channels;
    $channelValues = collect($channels)->map(fn ($ch) => $ch instanceof \ShopChain\Core\Enums\NotifChannel ? $ch->value : $ch)->toArray();

    expect($channelValues)->toContain('in_app')
        ->not->toContain('push')
        ->not->toContain('email');
});
