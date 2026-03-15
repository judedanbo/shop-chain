<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\Till;

class TillPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('pos.access')
            || $user->hasPermissionTo('sales.view');
    }

    public function view(User $user, Till $till): bool
    {
        return $user->hasPermissionTo('pos.access')
            || $user->hasPermissionTo('sales.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('pos.access');
    }

    public function close(User $user, Till $till): bool
    {
        return $user->hasPermissionTo('pos.access');
    }

    public function recordPayment(User $user, Till $till): bool
    {
        return $user->hasPermissionTo('pos.access');
    }
}
