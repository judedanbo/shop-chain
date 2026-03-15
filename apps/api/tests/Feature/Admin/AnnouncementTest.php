<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\AnnouncementStatus;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\Announcement;

function createAnnouncementAdmin(): User
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

it('lists announcements', function () {
    createAnnouncementAdmin();

    $response = $this->getJson('/api/v1/admin/announcements');

    $response->assertOk();
});

it('creates announcement as draft', function () {
    $user = createAnnouncementAdmin();

    $response = $this->postJson('/api/v1/admin/announcements', [
        'title' => 'Test Announcement',
        'body' => 'This is a test announcement body.',
        'target' => 'all',
        'priority' => 'info',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'draft');
});

it('shows single announcement', function () {
    $user = createAnnouncementAdmin();

    $announcement = Announcement::create([
        'title' => 'Show Test',
        'body' => 'Body content.',
        'target' => 'all',
        'priority' => 'info',
        'status' => AnnouncementStatus::Draft,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/admin/announcements/{$announcement->id}");

    $response->assertOk();
});

it('updates announcement', function () {
    $user = createAnnouncementAdmin();

    $announcement = Announcement::create([
        'title' => 'Original Title',
        'body' => 'Body content.',
        'target' => 'all',
        'priority' => 'info',
        'status' => AnnouncementStatus::Draft,
        'created_by' => $user->id,
    ]);

    $response = $this->putJson("/api/v1/admin/announcements/{$announcement->id}", [
        'title' => 'Updated Title',
    ]);

    $response->assertOk();
});

it('publishes announcement', function () {
    $user = createAnnouncementAdmin();

    $announcement = Announcement::create([
        'title' => 'Publish Test',
        'body' => 'Body content.',
        'target' => 'all',
        'priority' => 'info',
        'status' => AnnouncementStatus::Draft,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/admin/announcements/{$announcement->id}/publish");

    $response->assertOk()
        ->assertJsonPath('data.status', 'active');
});

it('unpublishes announcement', function () {
    $user = createAnnouncementAdmin();

    $announcement = Announcement::create([
        'title' => 'Unpublish Test',
        'body' => 'Body content.',
        'target' => 'all',
        'priority' => 'info',
        'status' => AnnouncementStatus::Active,
        'created_by' => $user->id,
    ]);

    $response = $this->postJson("/api/v1/admin/announcements/{$announcement->id}/unpublish");

    $response->assertOk()
        ->assertJsonPath('data.status', 'draft');
});

it('deletes announcement', function () {
    $user = createAnnouncementAdmin();

    $announcement = Announcement::create([
        'title' => 'Delete Test',
        'body' => 'Body content.',
        'target' => 'all',
        'priority' => 'info',
        'status' => AnnouncementStatus::Draft,
        'created_by' => $user->id,
    ]);

    $response = $this->deleteJson("/api/v1/admin/announcements/{$announcement->id}");

    $response->assertNoContent();
});

it('validates required fields on create', function () {
    createAnnouncementAdmin();

    $response = $this->postJson('/api/v1/admin/announcements', []);

    $response->assertUnprocessable();
});
