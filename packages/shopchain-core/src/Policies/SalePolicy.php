<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\Sale;

class SalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('pos.access')
            || $user->hasPermissionTo('sales.view');
    }

    public function view(User $user, Sale $sale): bool
    {
        return $user->hasPermissionTo('pos.access')
            || $user->hasPermissionTo('sales.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('pos.access');
    }

    public function reverse(User $user, Sale $sale): bool
    {
        return $user->hasPermissionTo('pos.void');
    }

    public function requestReversal(User $user, Sale $sale): bool
    {
        return $user->hasPermissionTo('pos.access');
    }

    public function approveReversal(User $user, Sale $sale): bool
    {
        return $user->hasPermissionTo('pos.void');
    }

    public function rejectReversal(User $user, Sale $sale): bool
    {
        return $user->hasPermissionTo('pos.void');
    }

    public function viewAnalytics(User $user): bool
    {
        return $user->hasPermissionTo('reports.view');
    }
}
