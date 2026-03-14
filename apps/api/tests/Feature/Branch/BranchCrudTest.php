<?php

use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Subscription;

it('lists branches for a shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    Branch::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'name' => 'Main Branch',
        'is_default' => true,
    ]);
    Branch::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Second Branch',
    ]);

    $response = $this->getJson("/api/v1/shops/{$shop->id}/branches");

    $response->assertSuccessful()
        ->assertJsonCount(2, 'data');
});

it('creates a branch', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Basic plan allows 3 branches
    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addYear(),
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/branches", [
        'name' => 'Accra Branch',
        'type' => 'retail',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Accra Branch')
        ->assertJsonPath('data.shop_id', $shop->id);
});

it('enforces unique branch name per shop', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Basic plan allows branches
    Subscription::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'plan_id' => 'basic',
        'status' => SubscriptionStatus::Active,
        'started_at' => now(),
        'expires_at' => now()->addYear(),
    ]);

    Branch::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Accra Branch',
    ]);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/branches", [
        'name' => 'Accra Branch',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('blocks branch creation when plan limit reached', function () {
    ['shop' => $shop] = createOwnerWithShop();

    // Free plan: branchesPerShop = 0, so creation is blocked
    $response = $this->postJson("/api/v1/shops/{$shop->id}/branches", [
        'name' => 'New Branch',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('limit', 'branchesPerShop');
});

it('updates a branch', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $branch = Branch::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Old Name',
    ]);

    $response = $this->putJson("/api/v1/shops/{$shop->id}/branches/{$branch->id}", [
        'name' => 'New Name',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.name', 'New Name');
});

it('cannot delete the default branch', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $defaultBranch = Branch::withoutGlobalScopes()->create([
        'shop_id' => $shop->id,
        'name' => 'Main Branch',
        'is_default' => true,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/branches/{$defaultBranch->id}");

    $response->assertUnprocessable();
    expect(Branch::withoutGlobalScopes()->find($defaultBranch->id))->not->toBeNull();
});

it('deletes a non-default branch', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $branch = Branch::factory()->create([
        'shop_id' => $shop->id,
        'name' => 'Temporary Branch',
        'is_default' => false,
    ]);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/branches/{$branch->id}");

    $response->assertNoContent();
    expect(Branch::withoutGlobalScopes()->find($branch->id))->toBeNull();
});

it('forbids viewer from creating branches', function () {
    ['shop' => $shop] = createOwnerWithShop();

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->postJson("/api/v1/shops/{$shop->id}/branches", [
        'name' => 'Forbidden Branch',
    ]);

    $response->assertForbidden();
});

it('forbids viewer from deleting branches', function () {
    ['shop' => $shop] = createOwnerWithShop();

    $branch = Branch::factory()->create([
        'shop_id' => $shop->id,
    ]);

    createMemberWithRole($shop, ShopRole::Viewer);

    $response = $this->deleteJson("/api/v1/shops/{$shop->id}/branches/{$branch->id}");

    $response->assertForbidden();
});
