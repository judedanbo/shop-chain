<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\RiskLevel;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\DetectionRule;

function createDetectionRuleAdmin(): User
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

it('lists detection rules', function () {
    createDetectionRuleAdmin();

    $response = $this->getJson('/api/v1/admin/detection-rules');

    $response->assertOk();
});

it('creates detection rule', function () {
    createDetectionRuleAdmin();

    $response = $this->postJson('/api/v1/admin/detection-rules', [
        'name' => 'High Refund Rate',
        'description' => 'Triggers when refund rate exceeds threshold',
        'threshold' => 25,
        'severity' => 'high',
    ]);

    $response->assertCreated();
});

it('updates detection rule', function () {
    createDetectionRuleAdmin();

    $rule = DetectionRule::create([
        'name' => 'Original Rule',
        'description' => 'Original description',
        'threshold' => 10,
        'severity' => RiskLevel::Medium,
        'enabled' => true,
        'triggers' => 0,
    ]);

    $response = $this->putJson("/api/v1/admin/detection-rules/{$rule->id}", [
        'name' => 'Updated Rule',
    ]);

    $response->assertOk();
});

it('toggles detection rule', function () {
    createDetectionRuleAdmin();

    $rule = DetectionRule::create([
        'name' => 'Toggle Rule',
        'description' => 'Rule to toggle',
        'threshold' => 15,
        'severity' => RiskLevel::Low,
        'enabled' => true,
        'triggers' => 0,
    ]);

    $response = $this->postJson("/api/v1/admin/detection-rules/{$rule->id}/toggle");

    $response->assertOk();
});

it('deletes detection rule', function () {
    createDetectionRuleAdmin();

    $rule = DetectionRule::create([
        'name' => 'Delete Rule',
        'description' => 'Rule to delete',
        'threshold' => 5,
        'severity' => RiskLevel::Low,
        'enabled' => true,
        'triggers' => 0,
    ]);

    $response = $this->deleteJson("/api/v1/admin/detection-rules/{$rule->id}");

    $response->assertNoContent();
});
