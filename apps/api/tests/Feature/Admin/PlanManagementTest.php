<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\PlanLifecycle;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\Plan;
use ShopChain\Core\Models\Subscription;

function createAdminUser(): User
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

it('lists all plans for admin', function () {
    createAdminUser();

    $response = $this->getJson('/api/v1/admin/plans');

    $response->assertOk()
        ->assertJsonCount(3, 'data'); // free, basic, max from seeder
});

it('creates a draft plan', function () {
    createAdminUser();

    $response = $this->postJson('/api/v1/admin/plans', [
        'id' => 'enterprise',
        'name' => 'Enterprise',
        'price' => 299.00,
        'limits' => ['shops' => -1, 'branchesPerShop' => -1],
        'features' => ['api-access' => true, 'reports' => true],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.id', 'enterprise')
        ->assertJsonPath('data.lifecycle', 'draft');
});

it('shows a single plan', function () {
    createAdminUser();

    $response = $this->getJson('/api/v1/admin/plans/basic');

    $response->assertOk()
        ->assertJsonPath('data.id', 'basic');
});

it('updates a plan', function () {
    createAdminUser();

    $plan = Plan::factory()->create(['id' => 'test-update', 'lifecycle' => PlanLifecycle::Draft]);

    $response = $this->putJson("/api/v1/admin/plans/{$plan->id}", [
        'name' => 'Updated Plan',
        'price' => 99.00,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Updated Plan');
});

it('transitions plan lifecycle', function () {
    createAdminUser();

    $plan = Plan::factory()->create(['id' => 'lifecycle-test', 'lifecycle' => PlanLifecycle::Draft]);

    // Draft -> Active
    $response = $this->postJson("/api/v1/admin/plans/{$plan->id}/transition", [
        'lifecycle' => 'active',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.lifecycle', 'active');
});

it('retires plan with subscriber migration', function () {
    createAdminUser();

    $oldPlan = Plan::factory()->create(['id' => 'old-plan', 'lifecycle' => PlanLifecycle::Retiring]);

    $user = User::factory()->create();
    $shop = \ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $user->id]);

    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'old-plan',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addDays(30),
        'auto_renew' => true,
    ]);

    $response = $this->postJson("/api/v1/admin/plans/{$oldPlan->id}/transition", [
        'lifecycle' => 'retired',
        'fallback_id' => 'basic',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.lifecycle', 'retired');

    $sub = Subscription::withoutGlobalScopes()->where('shop_id', $shop->id)->first();
    expect($sub->plan_id)->toBe('basic');
});

it('rejects invalid lifecycle transition', function () {
    createAdminUser();

    // free plan is Active — cannot go back to Draft
    $response = $this->postJson('/api/v1/admin/plans/free/transition', [
        'lifecycle' => 'draft',
    ]);

    $response->assertStatus(500); // InvalidArgumentException
});

it('forbids non-admin from plan endpoints', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/plans');

    $response->assertForbidden();
});
