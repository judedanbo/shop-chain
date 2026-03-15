<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;

function createInvestorAdmin(): User
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

it('returns engagement metrics', function () {
    createInvestorAdmin();

    $response = $this->getJson('/api/v1/admin/investors/engagement');

    $response->assertOk()
        ->assertJsonStructure(['data' => ['dau', 'wau', 'mau']]);
});

it('returns conversion funnel', function () {
    createInvestorAdmin();

    $response = $this->getJson('/api/v1/admin/investors/funnel');

    $response->assertOk();
});

it('returns growth metrics', function () {
    createInvestorAdmin();

    $response = $this->getJson('/api/v1/admin/investors/growth');

    $response->assertOk();
});

it('returns cohort retention', function () {
    createInvestorAdmin();

    $response = $this->getJson('/api/v1/admin/investors/cohort-retention');

    $response->assertOk();
});

it('returns deck metrics', function () {
    createInvestorAdmin();

    $response = $this->getJson('/api/v1/admin/investors/deck');

    $response->assertOk();
});

it('manages milestones', function () {
    createInvestorAdmin();

    // Create
    $createResponse = $this->postJson('/api/v1/admin/milestones', [
        'date' => '2026-03-15',
        'title' => 'Beta Launch',
        'description' => 'Launched beta version to early adopters.',
    ]);

    $createResponse->assertCreated();
    $milestoneId = $createResponse->json('data.id');

    // List
    $listResponse = $this->getJson('/api/v1/admin/milestones');
    $listResponse->assertOk();

    // Update
    $updateResponse = $this->putJson("/api/v1/admin/milestones/{$milestoneId}", [
        'title' => 'Updated Beta Launch',
    ]);
    $updateResponse->assertOk();

    // Delete
    $deleteResponse = $this->deleteJson("/api/v1/admin/milestones/{$milestoneId}");
    $deleteResponse->assertNoContent();
});

it('forbids non-admin from investor endpoints', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/investors/engagement');

    $response->assertForbidden();
});
