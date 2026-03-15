<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\KitchenOrder;

class KitchenOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('kitchen.view');
    }

    public function view(User $user, KitchenOrder $order): bool
    {
        return $user->hasPermissionTo('kitchen.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('kitchen.manage')
            || $user->hasPermissionTo('pos.access');
    }

    public function updateStatus(User $user, KitchenOrder $order): bool
    {
        return $user->hasPermissionTo('kitchen.manage');
    }

    public function serveItem(User $user, KitchenOrder $order): bool
    {
        return $user->hasPermissionTo('kitchen.manage');
    }
}
