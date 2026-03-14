<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\Supplier;

class SupplierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('suppliers.view');
    }

    public function view(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo('suppliers.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('suppliers.edit');
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo('suppliers.edit');
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo('suppliers.delete');
    }
}
