<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\ShopMember;

class ShopMemberPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('team.view');
    }

    public function view(User $user, ShopMember $member): bool
    {
        return $user->hasPermissionTo('team.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('team.manage');
    }

    public function updateRole(User $user, ShopMember $member): bool
    {
        return $user->hasPermissionTo('team.roles');
    }

    public function updateStatus(User $user, ShopMember $member): bool
    {
        return $user->hasPermissionTo('team.manage');
    }

    public function assignBranches(User $user, ShopMember $member): bool
    {
        return $user->hasPermissionTo('team.manage');
    }

    public function delete(User $user, ShopMember $member): bool
    {
        return $user->hasPermissionTo('team.manage');
    }
}
