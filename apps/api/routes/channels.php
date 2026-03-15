<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use ShopChain\Core\Models\ShopMember;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

Broadcast::channel('user.{userId}', function (User $user, string $userId) {
    return $user->id === $userId;
});

Broadcast::channel('shop.{shopId}.kitchen.{branchId}', function (User $user, string $shopId, string $branchId) {
    return ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shopId)
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->exists();
});

Broadcast::channel('shop.{shopId}.pos', function (User $user, string $shopId) {
    return ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shopId)
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->exists();
});

Broadcast::channel('shop.{shopId}.inventory', function (User $user, string $shopId) {
    return ShopMember::withoutGlobalScopes()
        ->where('shop_id', $shopId)
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->exists();
});
