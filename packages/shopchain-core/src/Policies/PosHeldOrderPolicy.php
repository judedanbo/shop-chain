<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\PosHeldOrder;

class PosHeldOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('pos.access');
    }

    public function view(User $user, PosHeldOrder $posHeldOrder): bool
    {
        return $user->hasPermissionTo('pos.access');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('pos.access');
    }

    public function delete(User $user, PosHeldOrder $posHeldOrder): bool
    {
        return $user->hasPermissionTo('pos.access');
    }
}
