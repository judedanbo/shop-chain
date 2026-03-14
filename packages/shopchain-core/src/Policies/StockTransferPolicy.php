<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\StockTransfer;

class StockTransferPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('inventory.view');
    }

    public function view(User $user, StockTransfer $transfer): bool
    {
        return $user->hasPermissionTo('inventory.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('inventory.transfer');
    }

    public function update(User $user, StockTransfer $transfer): bool
    {
        return $user->hasPermissionTo('inventory.transfer');
    }
}
