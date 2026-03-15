<?php

use App\Models\User;
use App\Services\PlanEnforcementService;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\BillingExemption;
use ShopChain\Core\Models\Shop;

function createAdminForExemptions(): User
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

it('grants a billing exemption', function () {
    createAdminForExemptions();

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    $response = $this->postJson("/api/v1/admin/shops/{$shop->id}/exemptions", [
        'period' => 3,
        'unit' => 'months',
        'reason' => 'Beta tester reward',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.period', 3)
        ->assertJsonPath('data.reason', 'Beta tester reward');
});

it('lists exemptions for a shop', function () {
    createAdminForExemptions();

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    BillingExemption::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'granted_by' => User::factory()->create()->id,
        'period' => 1,
        'unit' => 'months',
        'reason' => 'Test',
        'starts_at' => now(),
        'expires_at' => now()->addMonth(),
    ]);

    $response = $this->getJson("/api/v1/admin/shops/{$shop->id}/exemptions");

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('revokes an exemption', function () {
    createAdminForExemptions();

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    $exemption = BillingExemption::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'granted_by' => User::factory()->create()->id,
        'period' => 1,
        'unit' => 'months',
        'reason' => 'Test',
        'starts_at' => now(),
        'expires_at' => now()->addMonth(),
    ]);

    $response = $this->deleteJson("/api/v1/admin/shops/{$shop->id}/exemptions/{$exemption->id}");

    $response->assertNoContent();

    // expires_at should be set to now (effectively revoked)
    expect($exemption->fresh()->expires_at->isPast() || $exemption->fresh()->expires_at->isCurrentMinute())->toBeTrue();
});

it('exempted shop bypasses plan limits', function () {
    createAdminForExemptions();

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    // Create active exemption
    BillingExemption::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'granted_by' => User::factory()->create()->id,
        'period' => 1,
        'unit' => 'months',
        'unlimited' => false,
        'reason' => 'Test',
        'starts_at' => now()->subDay(),
        'expires_at' => now()->addMonth(),
    ]);

    $service = app(PlanEnforcementService::class);
    expect($service->isExempt($shop))->toBeTrue()
        ->and($service->canAdd($shop, 'shops'))->toBeTrue();
});

it('grants unlimited exemption', function () {
    createAdminForExemptions();

    $owner = User::factory()->create();
    $shop = Shop::factory()->create(['owner_id' => $owner->id]);

    $response = $this->postJson("/api/v1/admin/shops/{$shop->id}/exemptions", [
        'unlimited' => true,
        'reason' => 'VIP partner',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.unlimited', true);

    $exemption = BillingExemption::withoutGlobalScopes()->where('shop_id', $shop->id)->first();
    expect($exemption->expires_at)->toBeNull();
});

it('forbids non-admin from exemption endpoints', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $shop = Shop::factory()->create(['owner_id' => $user->id]);

    $response = $this->postJson("/api/v1/admin/shops/{$shop->id}/exemptions", [
        'period' => 1,
        'unit' => 'months',
        'reason' => 'Should fail',
    ]);

    $response->assertForbidden();
});
