<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\StockAdjustment;

class StockAdjustmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('inventory.view');
    }

    public function view(User $user, StockAdjustment $adjustment): bool
    {
        return $user->hasPermissionTo('inventory.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('inventory.adjust');
    }

    public function approve(User $user, StockAdjustment $adjustment): bool
    {
        return $user->hasPermissionTo('inventory.approve');
    }

    public function reject(User $user, StockAdjustment $adjustment): bool
    {
        return $user->hasPermissionTo('inventory.approve');
    }
}
