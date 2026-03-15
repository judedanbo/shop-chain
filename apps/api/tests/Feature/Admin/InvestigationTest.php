<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\AuditCategory;
use ShopChain\Core\Enums\InvestigationStatus;
use ShopChain\Core\Enums\RiskLevel;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\AuditEvent;
use ShopChain\Core\Models\Investigation;

function createInvestigationAdmin(): User
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

it('lists investigations', function () {
    createInvestigationAdmin();

    $response = $this->getJson('/api/v1/admin/investigations');

    $response->assertOk();
});

it('creates investigation', function () {
    $user = createInvestigationAdmin();

    $assignee = User::factory()->create();
    AdminUser::create([
        'user_id' => $assignee->id,
        'role' => AdminRole::Auditor,
        'status' => AdminTeamStatus::Active,
    ]);

    $response = $this->postJson('/api/v1/admin/investigations', [
        'title' => 'Suspicious Activity',
        'priority' => 'high',
        'assignee_id' => $assignee->id,
        'description' => 'Investigating suspicious transactions.',
    ]);

    $response->assertCreated();
});

it('shows investigation', function () {
    $user = createInvestigationAdmin();

    $investigation = Investigation::create([
        'title' => 'Test Investigation',
        'status' => InvestigationStatus::Open,
        'priority' => RiskLevel::Medium,
        'assignee_id' => $user->id,
        'description' => 'Test description.',
    ]);

    $response = $this->getJson("/api/v1/admin/investigations/{$investigation->id}");

    $response->assertOk();
});

it('updates investigation', function () {
    $user = createInvestigationAdmin();

    $investigation = Investigation::create([
        'title' => 'Original Title',
        'status' => InvestigationStatus::Open,
        'priority' => RiskLevel::Medium,
        'assignee_id' => $user->id,
        'description' => 'Test description.',
    ]);

    $response = $this->putJson("/api/v1/admin/investigations/{$investigation->id}", [
        'title' => 'Updated Title',
    ]);

    $response->assertOk();
});

it('transitions investigation status', function () {
    $user = createInvestigationAdmin();

    $investigation = Investigation::create([
        'title' => 'Transition Test',
        'status' => InvestigationStatus::Open,
        'priority' => RiskLevel::High,
        'assignee_id' => $user->id,
        'description' => 'Transition test description.',
    ]);

    $response = $this->postJson("/api/v1/admin/investigations/{$investigation->id}/transition", [
        'status' => 'in_progress',
    ]);

    $response->assertOk();
});

it('adds note to investigation', function () {
    $user = createInvestigationAdmin();

    $investigation = Investigation::create([
        'title' => 'Note Test',
        'status' => InvestigationStatus::Open,
        'priority' => RiskLevel::Medium,
        'assignee_id' => $user->id,
        'description' => 'Test description.',
    ]);

    $response = $this->postJson("/api/v1/admin/investigations/{$investigation->id}/notes", [
        'content' => 'This is an investigation note.',
    ]);

    $response->assertCreated();
});

it('links audit event to investigation', function () {
    $user = createInvestigationAdmin();

    $investigation = Investigation::create([
        'title' => 'Link Test',
        'status' => InvestigationStatus::Open,
        'priority' => RiskLevel::Medium,
        'assignee_id' => $user->id,
        'description' => 'Test description.',
    ]);

    $event = AuditEvent::create([
        'actor_id' => $user->id,
        'category' => AuditCategory::Financial,
        'action' => 'suspicious_refund',
        'target' => 'sale_123',
        'risk_score' => 80,
    ]);

    $response = $this->postJson("/api/v1/admin/investigations/{$investigation->id}/events", [
        'audit_event_id' => $event->id,
    ]);

    $response->assertNoContent();
});

it('rejects invalid status transition', function () {
    $user = createInvestigationAdmin();

    $investigation = Investigation::create([
        'title' => 'Closed Investigation',
        'status' => InvestigationStatus::Closed,
        'priority' => RiskLevel::Low,
        'assignee_id' => $user->id,
        'description' => 'Already closed.',
    ]);

    $response = $this->postJson("/api/v1/admin/investigations/{$investigation->id}/transition", [
        'status' => 'in_progress',
    ]);

    $response->assertStatus(500);
});
