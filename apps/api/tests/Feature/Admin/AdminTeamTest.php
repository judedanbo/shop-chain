<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;

it('lists admin team members', function () {
    createAdminUser();

    $response = $this->getJson('/api/v1/admin/team');

    $response->assertOk()
        ->assertJsonStructure(['data']);
});

it('invites a new admin team member', function () {
    createAdminUser();

    $response = $this->postJson('/api/v1/admin/team/invite', [
        'name' => 'New Admin',
        'email' => 'newadmin@example.com',
        'role' => 'auditor',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.role', 'auditor')
        ->assertJsonPath('data.status', 'invited');
});

it('shows an admin team member', function () {
    createAdminUser();

    $other = User::factory()->create();
    $admin = AdminUser::create([
        'user_id' => $other->id,
        'role' => AdminRole::Auditor,
        'status' => AdminTeamStatus::Active,
    ]);

    $response = $this->getJson("/api/v1/admin/team/{$admin->id}");

    $response->assertOk();
});

it('updates admin role', function () {
    createAdminUser();

    $other = User::factory()->create();
    $admin = AdminUser::create([
        'user_id' => $other->id,
        'role' => AdminRole::Admin,
        'status' => AdminTeamStatus::Active,
    ]);

    $response = $this->patchJson("/api/v1/admin/team/{$admin->id}/role", [
        'role' => 'auditor',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.role', 'auditor');
});

it('updates admin status', function () {
    createAdminUser();

    $other = User::factory()->create();
    $admin = AdminUser::create([
        'user_id' => $other->id,
        'role' => AdminRole::Admin,
        'status' => AdminTeamStatus::Active,
    ]);

    $response = $this->patchJson("/api/v1/admin/team/{$admin->id}/status", [
        'status' => 'suspended',
    ]);

    $response->assertOk();
});

it('removes an admin team member', function () {
    createAdminUser();

    $other = User::factory()->create();
    $admin = AdminUser::create([
        'user_id' => $other->id,
        'role' => AdminRole::Auditor,
        'status' => AdminTeamStatus::Active,
    ]);

    $response = $this->deleteJson("/api/v1/admin/team/{$admin->id}");

    $response->assertNoContent();
});

it('prevents self-removal', function () {
    $user = createAdminUser();

    $admin = AdminUser::where('user_id', $user->id)->first();

    $response = $this->deleteJson("/api/v1/admin/team/{$admin->id}");

    $response->assertStatus(500);
});

it('prevents removing last super admin', function () {
    $user = createAdminUser();

    $admin = AdminUser::where('user_id', $user->id)->first();

    $response = $this->deleteJson("/api/v1/admin/team/{$admin->id}");

    $response->assertStatus(500);
});

it('rejects invalid role', function () {
    createAdminUser();

    $response = $this->postJson('/api/v1/admin/team/invite', [
        'name' => 'Bad Role',
        'email' => 'badrole@example.com',
        'role' => 'invalid_role',
    ]);

    $response->assertUnprocessable();
});

it('forbids non-admin from team endpoints', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/team');

    $response->assertForbidden();
});
