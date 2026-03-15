<?php

use App\Models\User;
use Laravel\Pennant\Feature;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\BranchMember;
use ShopChain\Core\Models\ShopMember;

/* ------------------------------------------------------------------ */
/*  Invite                                                             */
/* ------------------------------------------------------------------ */

it('invites a new member with role', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/invite", [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'role' => ShopRole::Cashier->value,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.role', ShopRole::Cashier->value)
        ->assertJsonPath('data.status', MemberStatus::Invited->value)
        ->assertJsonPath('data.user.name', 'Jane Doe')
        ->assertJsonPath('data.user.email', 'jane@example.com');

    $member = ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shop->id)
        ->whereHas('user', fn ($q) => $q->where('email', 'jane@example.com'))
        ->first();

    expect($member)->not->toBeNull()
        ->and($member->role)->toBe(ShopRole::Cashier)
        ->and($member->user->hasRole('cashier'))->toBeTrue();
});

it('enforces role hierarchy on invite', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Feature::for($shop)->activate('general-manager');
    createMemberWithRole($shop, ShopRole::GeneralManager);

    // GM (level 2) cannot invite GM (level 2) — must be strictly above
    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/invite", [
        'name' => 'Another GM',
        'email' => 'gm2@example.com',
        'role' => ShopRole::GeneralManager->value,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['role']);
});

it('enforces plan limit teamPerShop on invite', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Free plan: teamPerShop = 3. Owner counts as 1 active member.
    // Create 2 more active members to reach the limit of 3.
    ShopMember::withoutGlobalScopes()->create([
        'user_id' => User::factory()->create()->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);
    ShopMember::withoutGlobalScopes()->create([
        'user_id' => User::factory()->create()->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/invite", [
        'name' => 'Blocked User',
        'email' => 'blocked@example.com',
        'role' => ShopRole::Viewer->value,
    ]);

    $response->assertForbidden()
        ->assertJsonPath('limit', 'teamPerShop');
});

it('rejects duplicate email for same shop on invite', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $existingUser = User::factory()->create(['email' => 'existing@example.com']);
    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $existingUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/invite", [
        'name' => 'Duplicate',
        'email' => 'existing@example.com',
        'role' => ShopRole::Cashier->value,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('invites a member with branch assignments', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch1 = Branch::factory()->create(['shop_id' => $shop->id]);
    $branch2 = Branch::factory()->create(['shop_id' => $shop->id]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/invite", [
        'name' => 'Branch Worker',
        'email' => 'branches@example.com',
        'role' => ShopRole::Cashier->value,
        'branch_ids' => [$branch1->id, $branch2->id],
    ]);

    $response->assertCreated()
        ->assertJsonCount(2, 'data.branches');
});

it('rejects general manager role without feature flag', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Free plan has generalManager: false
    Feature::for($shop)->deactivate('general-manager');

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/invite", [
        'name' => 'Would-be GM',
        'email' => 'gm@example.com',
        'role' => ShopRole::GeneralManager->value,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['role']);
});

/* ------------------------------------------------------------------ */
/*  Role Change                                                        */
/* ------------------------------------------------------------------ */

it('changes a member role', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $memberUser = User::factory()->create();
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);
    app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
    $memberUser->assignRole('cashier');

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$member->id}/role", [
        'role' => ShopRole::Salesperson->value,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.role', ShopRole::Salesperson->value);

    expect($memberUser->fresh()->hasRole('salesperson'))->toBeTrue()
        ->and($memberUser->fresh()->hasRole('cashier'))->toBeFalse();
});

it('cannot change owner role', function () {
    ['shop' => $shop, 'member' => $ownerMember] = createOwnerWithShop();

    // Create another owner-level user to attempt the change
    $otherUser = User::factory()->create();
    ShopMember::withoutGlobalScopes()->create([
        'user_id' => $otherUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$ownerMember->id}/role", [
        'role' => ShopRole::Manager->value,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['role']);
});

it('prevents general manager from assigning role at or above own level', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Feature::for($shop)->activate('general-manager');
    createMemberWithRole($shop, ShopRole::GeneralManager);

    $targetUser = User::factory()->create();
    $target = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $targetUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);
    app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
    $targetUser->assignRole('cashier');

    // GM (level 2) cannot assign GM role (level 2) — must be strictly above
    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$target->id}/role", [
        'role' => ShopRole::GeneralManager->value,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['role']);
});

/* ------------------------------------------------------------------ */
/*  Status                                                             */
/* ------------------------------------------------------------------ */

it('suspends a member', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $memberUser = User::factory()->create();
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$member->id}/status", [
        'status' => MemberStatus::Suspended->value,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', MemberStatus::Suspended->value);
});

it('reactivates a suspended member', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $memberUser = User::factory()->create();
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Suspended,
        'joined_at' => now(),
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$member->id}/status", [
        'status' => MemberStatus::Active->value,
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.status', MemberStatus::Active->value);
});

it('cannot suspend owner', function () {
    ['shop' => $shop, 'member' => $ownerMember] = createOwnerWithShop();

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$ownerMember->id}/status", [
        'status' => MemberStatus::Suspended->value,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

/* ------------------------------------------------------------------ */
/*  Branch Assignment                                                  */
/* ------------------------------------------------------------------ */

it('assigns branches to a member', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch1 = Branch::factory()->create(['shop_id' => $shop->id]);
    $branch2 = Branch::factory()->create(['shop_id' => $shop->id]);

    $memberUser = User::factory()->create();
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$member->id}/branches", [
        'branch_ids' => [$branch1->id, $branch2->id],
    ]);

    $response->assertSuccessful()
        ->assertJsonCount(2, 'data.branches');

    expect($member->fresh()->branches)->toHaveCount(2);
});

it('validates branches belong to shop on assign', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $otherOwner = User::factory()->create();
    $otherShop = \ShopChain\Core\Models\Shop::factory()->create(['owner_id' => $otherOwner->id]);
    $otherBranch = Branch::factory()->create(['shop_id' => $otherShop->id]);

    $memberUser = User::factory()->create();
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$member->id}/branches", [
        'branch_ids' => [$otherBranch->id],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['branch_ids.0']);
});

/* ------------------------------------------------------------------ */
/*  Remove                                                             */
/* ------------------------------------------------------------------ */

it('removes a member', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $memberUser = User::factory()->create();
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);
    app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
    $memberUser->assignRole('cashier');

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/team/{$member->id}");

    $response->assertNoContent();

    expect($member->fresh()->status)->toBe(MemberStatus::Removed)
        ->and($memberUser->fresh()->hasRole('cashier'))->toBeFalse();
});

it('cannot remove owner', function () {
    ['shop' => $shop, 'member' => $ownerMember] = createOwnerWithShop();

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/team/{$ownerMember->id}");

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['member']);
});

/* ------------------------------------------------------------------ */
/*  List / Show                                                        */
/* ------------------------------------------------------------------ */

it('lists team members with filters', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Create members with different roles/statuses
    ShopMember::withoutGlobalScopes()->create([
        'user_id' => User::factory()->create()->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);
    ShopMember::withoutGlobalScopes()->create([
        'user_id' => User::factory()->create()->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Manager,
        'status' => MemberStatus::Suspended,
        'joined_at' => now(),
    ]);

    // List all — owner + 2 members
    $response = $this->getJson("/api/v1/shops/{$shop->id}/team");
    $response->assertSuccessful()
        ->assertJsonCount(3, 'data');

    // Filter by status
    $response = $this->getJson("/api/v1/shops/{$shop->id}/team?filter[status]=suspended");
    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');

    // Filter by role
    $response = $this->getJson("/api/v1/shops/{$shop->id}/team?filter[role]=cashier");
    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('shows a member with user and branches', function () {
    ['shop' => $shop] = createOwnerWithShop();
    $branch = Branch::factory()->create(['shop_id' => $shop->id]);

    $memberUser = User::factory()->create(['name' => 'Show Test']);
    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $memberUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);
    BranchMember::create([
        'member_id' => $member->id,
        'branch_id' => $branch->id,
        'assigned_at' => now(),
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/team/{$member->id}");

    $response->assertSuccessful()
        ->assertJsonPath('data.user.name', 'Show Test')
        ->assertJsonCount(1, 'data.branches');
});

/* ------------------------------------------------------------------ */
/*  Authorization                                                      */
/* ------------------------------------------------------------------ */

it('allows manager to view team', function () {
    ['shop' => $shop] = createOwnerWithShop();
    createMemberWithRole($shop, ShopRole::Manager);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/team");

    $response->assertSuccessful();
});

it('forbids viewer from inviting members', function () {
    ['shop' => $shop] = createOwnerWithShop();
    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/team/invite", [
        'name' => 'Forbidden',
        'email' => 'forbidden@example.com',
        'role' => ShopRole::Cashier->value,
    ]);

    $response->assertForbidden();
});

it('forbids manager from changing roles', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $targetUser = User::factory()->create();
    $target = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $targetUser->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Cashier,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    createMemberWithRole($shop, ShopRole::Manager);

    $response = $this->patchJson("/api/v1/shops/{$shop->id}/team/{$target->id}/role", [
        'role' => ShopRole::Salesperson->value,
    ]);

    $response->assertForbidden();
});
