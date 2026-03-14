<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\Shop;

class ShopPolicy
{
    public function view(User $user, Shop $shop): bool
    {
        return true; // shop_member middleware already guarantees membership
    }

    public function update(User $user, Shop $shop): bool
    {
        return $user->hasPermissionTo('settings.edit');
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $shop->owner_id === $user->id;
    }

    public function updateSettings(User $user, Shop $shop): bool
    {
        return $user->hasPermissionTo('settings.edit');
    }

    public function uploadLogo(User $user, Shop $shop): bool
    {
        return $user->hasPermissionTo('settings.edit');
    }

    public function deleteLogo(User $user, Shop $shop): bool
    {
        return $user->hasPermissionTo('settings.edit');
    }
}
