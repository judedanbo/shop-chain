<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\Branch;

class BranchPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('branches.view');
    }

    public function view(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branches.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('branches.manage');
    }

    public function update(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branches.manage');
    }

    public function delete(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branches.manage');
    }
}
