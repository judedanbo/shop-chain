<?php

namespace ShopChain\Core\Traits;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Models\Notification;
use ShopChain\Core\Models\NotificationPreference;
use ShopChain\Core\Models\PaymentMethod;
use ShopChain\Core\Models\Session;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;

trait HasShopRelationships
{
    public function ownedShops(): HasMany
    {
        return $this->hasMany(Shop::class, 'owner_id');
    }

    public function shopMembers(): HasMany
    {
        return $this->hasMany(ShopMember::class);
    }

    public function shops(): BelongsToMany
    {
        return $this->belongsToMany(Shop::class, 'shop_members')
            ->withPivot('role', 'status', 'joined_at')
            ->withTimestamps();
    }

    public function adminUser(): HasOne
    {
        return $this->hasOne(AdminUser::class);
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(PaymentMethod::class);
    }

    public function shopNotifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function notificationPreference(): HasOne
    {
        return $this->hasOne(NotificationPreference::class);
    }
}
