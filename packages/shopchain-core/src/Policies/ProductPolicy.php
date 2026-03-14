<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\Product;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('products.view');
    }

    public function view(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('products.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('products.edit');
    }

    public function update(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('products.edit');
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('products.delete');
    }

    public function updatePrice(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('products.price');
    }
}
