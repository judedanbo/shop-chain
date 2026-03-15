<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\AnomalyStatus;
use ShopChain\Core\Enums\InvestigationStatus;
use ShopChain\Core\Enums\RiskLevel;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\Anomaly;
use ShopChain\Core\Models\Investigation;

function createAnomalyAdmin(): User
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

it('lists anomalies', function () {
    createAnomalyAdmin();

    Anomaly::create([
        'rule' => 'high_refund_rate',
        'severity' => RiskLevel::High,
        'entity' => 'shop_123',
        'summary' => 'High refund rate detected',
        'status' => AnomalyStatus::Escalated,
    ]);

    $response = $this->getJson('/api/v1/admin/anomalies');

    $response->assertOk();
});

it('updates anomaly status', function () {
    createAnomalyAdmin();

    $anomaly = Anomaly::create([
        'rule' => 'high_refund_rate',
        'severity' => RiskLevel::High,
        'entity' => 'shop_123',
        'summary' => 'High refund rate detected',
        'status' => AnomalyStatus::Escalated,
    ]);

    $response = $this->patchJson("/api/v1/admin/anomalies/{$anomaly->id}/status", [
        'status' => 'resolved',
    ]);

    $response->assertOk();
});

it('links anomaly to investigation', function () {
    $user = createAnomalyAdmin();

    $anomaly = Anomaly::create([
        'rule' => 'high_refund_rate',
        'severity' => RiskLevel::High,
        'entity' => 'shop_123',
        'summary' => 'High refund rate detected',
        'status' => AnomalyStatus::Escalated,
    ]);

    $investigation = Investigation::create([
        'title' => 'Refund Investigation',
        'status' => InvestigationStatus::Open,
        'priority' => RiskLevel::High,
        'assignee_id' => $user->id,
        'description' => 'Investigating high refunds.',
    ]);

    $response = $this->postJson("/api/v1/admin/anomalies/{$anomaly->id}/investigate", [
        'investigation_id' => $investigation->id,
    ]);

    $response->assertOk();
});

it('filters by severity', function () {
    createAnomalyAdmin();

    Anomaly::create([
        'rule' => 'critical_rule',
        'severity' => RiskLevel::Critical,
        'entity' => 'shop_456',
        'summary' => 'Critical anomaly',
        'status' => AnomalyStatus::Escalated,
    ]);

    $response = $this->getJson('/api/v1/admin/anomalies?severity=critical');

    $response->assertOk();
});

it('forbids non-admin from anomalies', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/anomalies');

    $response->assertForbidden();
});
