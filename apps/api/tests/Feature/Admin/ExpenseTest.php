<?php

use App\Models\User;
use Laravel\Passport\Passport;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\ExpenseCategory;
use ShopChain\Core\Models\AdminExpense;
use ShopChain\Core\Models\AdminUser;

function createExpenseAdmin(): User
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

it('lists expenses', function () {
    createExpenseAdmin();

    $response = $this->getJson('/api/v1/admin/expenses');

    $response->assertOk();
});

it('creates expense', function () {
    createExpenseAdmin();

    $response = $this->postJson('/api/v1/admin/expenses', [
        'date' => '2026-03-15',
        'category' => 'infrastructure',
        'description' => 'Server hosting costs',
        'amount' => 5000,
        'vendor' => 'AWS',
    ]);

    $response->assertCreated();
});

it('shows expense', function () {
    $user = createExpenseAdmin();

    $expense = AdminExpense::create([
        'date' => '2026-03-15',
        'category' => ExpenseCategory::Infrastructure,
        'description' => 'Server hosting',
        'amount' => 5000,
        'vendor' => 'AWS',
        'recurring' => false,
        'created_by' => $user->id,
    ]);

    $response = $this->getJson("/api/v1/admin/expenses/{$expense->id}");

    $response->assertOk();
});

it('updates expense', function () {
    $user = createExpenseAdmin();

    $expense = AdminExpense::create([
        'date' => '2026-03-15',
        'category' => ExpenseCategory::Infrastructure,
        'description' => 'Server hosting',
        'amount' => 5000,
        'vendor' => 'AWS',
        'recurring' => false,
        'created_by' => $user->id,
    ]);

    $response = $this->putJson("/api/v1/admin/expenses/{$expense->id}", [
        'amount' => 7500,
    ]);

    $response->assertOk();
});

it('deletes expense', function () {
    $user = createExpenseAdmin();

    $expense = AdminExpense::create([
        'date' => '2026-03-15',
        'category' => ExpenseCategory::Infrastructure,
        'description' => 'Server hosting',
        'amount' => 5000,
        'vendor' => 'AWS',
        'recurring' => false,
        'created_by' => $user->id,
    ]);

    $response = $this->deleteJson("/api/v1/admin/expenses/{$expense->id}");

    $response->assertNoContent();
});

it('validates required fields', function () {
    createExpenseAdmin();

    $response = $this->postJson('/api/v1/admin/expenses', []);

    $response->assertUnprocessable();
});

it('forbids non-admin from expenses', function () {
    seedPermissionsAndPlans();
    $user = User::factory()->create();
    Passport::actingAs($user);

    $response = $this->getJson('/api/v1/admin/expenses');

    $response->assertForbidden();
});
