<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use ShopChain\Core\Enums\UserStatus;

class AdminUserManagementService
{
    public function list(array $filters): LengthAwarePaginator
    {
        $query = User::withCount('ownedShops');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ilike', "%{$filters['search']}%")
                    ->orWhere('email', 'ilike', "%{$filters['search']}%");
            });
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    public function show(User $user): User
    {
        return $user->load('ownedShops', 'adminUser', 'paymentMethods');
    }

    public function updateStatus(User $user, UserStatus $newStatus): User
    {
        $user->update(['status' => $newStatus]);

        return $user->refresh();
    }
}
