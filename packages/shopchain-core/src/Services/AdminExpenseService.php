<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use ShopChain\Core\Models\AdminExpense;
use ShopChain\Core\Models\AdminExpenseAttachment;

class AdminExpenseService
{
    public function list(array $filters): LengthAwarePaginator
    {
        $query = AdminExpense::with('creator', 'attachments');

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['recurring'])) {
            $query->where('recurring', filter_var($filters['recurring'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['from'])) {
            $query->where('date', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->where('date', '<=', $filters['to']);
        }

        return $query->latest('date')->paginate($filters['per_page'] ?? 15);
    }

    public function create(User $creator, array $data): AdminExpense
    {
        return AdminExpense::create([
            ...$data,
            'created_by' => $creator->id,
        ]);
    }

    public function update(AdminExpense $expense, array $data): AdminExpense
    {
        $expense->update($data);

        return $expense->refresh();
    }

    public function delete(AdminExpense $expense): void
    {
        $expense->delete();
    }

    public function addAttachment(AdminExpense $expense, array $data): AdminExpenseAttachment
    {
        return $expense->attachments()->create([
            ...$data,
            'added_at' => now(),
        ]);
    }

    public function removeAttachment(AdminExpenseAttachment $attachment): void
    {
        $attachment->delete();
    }
}
