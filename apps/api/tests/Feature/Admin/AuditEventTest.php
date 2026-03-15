<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\AuditCategory;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\AuditEvent;
use ShopChain\Core\Models\Shop;

function createAuditAdmin(): User
{
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    AdminUser::create([
        'user_id' => $user->id,
        'role' => AdminRole::SuperAdmin,
        'status' => AdminTeamStatus::Active,
    ]);
    Passport::actingAs($user);

    return $user;
}

it('lists audit events', function () {
    $user = createAuditAdmin();

    AuditEvent::create([
        'actor_id' => $user->id,
        'category' => AuditCategory::Financial,
        'action' => 'test_action',
        'target' => 'test_target',
        'risk_score' => 50,
    ]);

    $response = $this->getJson('/api/v1/admin/audit/events');

    $response->assertOk();
});

it('shows audit event', function () {
    $user = createAuditAdmin();

    $event = AuditEvent::create([
        'actor_id' => $user->id,
        'category' => AuditCategory::Financial,
        'action' => 'test_action',
        'target' => 'test_target',
        'risk_score' => 50,
    ]);

    $response = $this->getJson("/api/v1/admin/audit/events/{$event->id}");

    $response->assertOk();
});

it('filters by category', function () {
    $user = createAuditAdmin();

    AuditEvent::create([
        'actor_id' => $user->id,
        'category' => AuditCategory::Financial,
        'action' => 'test_action',
        'target' => 'test_target',
        'risk_score' => 50,
    ]);

    $response = $this->getJson('/api/v1/admin/audit/events?category=financial');

    $response->assertOk();
});

it('returns shop forensics', function () {
    $user = createAuditAdmin();

    $shop = Shop::factory()->create(['owner_id' => $user->id]);

    AuditEvent::create([
        'shop_id' => $shop->id,
        'actor_id' => $user->id,
        'category' => AuditCategory::Financial,
        'action' => 'test_action',
        'target' => 'test_target',
        'risk_score' => 50,
    ]);

    $response = $this->getJson("/api/v1/admin/audit/forensics/shops/{$shop->id}");

    $response->assertOk();
});

it('returns user forensics', function () {
    $user = createAuditAdmin();

    $target = User::factory()->create();

    AuditEvent::create([
        'actor_id' => $target->id,
        'category' => AuditCategory::Auth,
        'action' => 'login',
        'target' => 'session',
        'risk_score' => 10,
    ]);

    $response = $this->getJson("/api/v1/admin/audit/forensics/users/{$target->id}");

    $response->assertOk();
});

it('forbids non-admin from audit', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/audit/events');

    $response->assertForbidden();
});
