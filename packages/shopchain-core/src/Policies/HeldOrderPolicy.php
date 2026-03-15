<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\HeldOrder;

class HeldOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('kitchen.view');
    }

    public function view(User $user, HeldOrder $heldOrder): bool
    {
        return $user->hasPermissionTo('kitchen.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('kitchen.manage')
            || $user->hasPermissionTo('pos.access');
    }

    public function delete(User $user, HeldOrder $heldOrder): bool
    {
        return $user->hasPermissionTo('kitchen.manage')
            || $user->hasPermissionTo('pos.access');
    }
}
