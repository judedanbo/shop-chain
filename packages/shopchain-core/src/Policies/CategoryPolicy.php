<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\Category;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('products.view');
    }

    public function view(User $user, Category $category): bool
    {
        return $user->hasPermissionTo('products.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('products.edit');
    }

    public function update(User $user, Category $category): bool
    {
        return $user->hasPermissionTo('products.edit');
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->hasPermissionTo('products.edit');
    }
}
