<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use ShopChain\Core\Database\Seeders\PermissionSeeder;
use ShopChain\Core\Database\Seeders\PlanSeeder;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/

/**
 * Seed permissions and plans needed for shop tests.
 */
function seedPermissionsAndPlans(): void
{
    (new PlanSeeder)->run();
    (new PermissionSeeder)->run();
}

/**
 * Create an authenticated user with a shop and owner membership.
 *
 * @return array{user: User, shop: Shop, member: ShopMember}
 */
function createOwnerWithShop(array $shopOverrides = []): array
{
    seedPermissionsAndPlans();

    $user = User::factory()->create();

    $shop = Shop::factory()->create([
        'owner_id' => $user->id,
        ...$shopOverrides,
    ]);

    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'role' => ShopRole::Owner,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
    $user->assignRole('owner');

    Passport::actingAs($user);

    return compact('user', 'shop', 'member');
}

/**
 * Create a shop member with a specific role and act as that user.
 *
 * @return array{user: User, shop: Shop, member: ShopMember}
 */
function createMemberWithRole(Shop $shop, ShopRole $role): array
{
    $user = User::factory()->create();

    $member = ShopMember::withoutGlobalScopes()->create([
        'user_id' => $user->id,
        'shop_id' => $shop->id,
        'role' => $role,
        'status' => MemberStatus::Active,
        'joined_at' => now(),
    ]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
    $user->assignRole($role->value);

    Passport::actingAs($user);

    return compact('user', 'shop', 'member');
}

/**
 * Create an authenticated admin user (SuperAdmin by default).
 */
function createAdminUser(AdminRole $role = AdminRole::SuperAdmin): User
{
    seedPermissionsAndPlans();

    $user = User::factory()->create();
    AdminUser::create([
        'user_id' => $user->id,
        'role' => $role,
        'status' => AdminTeamStatus::Active,
    ]);

    Passport::actingAs($user);

    return $user;
}
