<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\PurchaseOrder;

class PurchaseOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('purchase_orders.view');
    }

    public function view(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->hasPermissionTo('purchase_orders.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('purchase_orders.create');
    }

    public function update(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->hasPermissionTo('purchase_orders.create');
    }

    public function approve(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->hasPermissionTo('purchase_orders.approve');
    }
}
