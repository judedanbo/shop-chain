<?php

namespace ShopChain\Core\Traits;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use ShopChain\Core\Enums\AdminRole;
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

    /**
     * Check if user has a specific admin permission based on their admin role.
     *
     * Admin permissions are checked via the AdminUser role mapping rather than
     * Spatie's team-scoped permission system, since admin roles are global.
     */
    public function hasAdminPermission(string $permission): bool
    {
        $adminUser = $this->adminUser ?? $this->adminUser()->first();

        if (! $adminUser) {
            return false;
        }

        return in_array($permission, self::adminRolePermissions()[$adminUser->role->value] ?? []);
    }

    /** @return array<string, list<string>> */
    private static function adminRolePermissions(): array
    {
        $all = [
            'admin.shops.manage', 'admin.users.manage', 'admin.billing.manage',
            'admin.subscriptions.manage', 'admin.announcements.manage',
            'admin.audit.view', 'admin.audit.investigate', 'admin.expenses.manage',
            'admin.team.manage', 'admin.settings.manage', 'admin.investors.manage',
            'admin.support.manage',
        ];

        return [
            AdminRole::SuperAdmin->value => $all,
            AdminRole::Admin->value => [
                'admin.shops.manage', 'admin.users.manage', 'admin.billing.manage',
                'admin.subscriptions.manage', 'admin.announcements.manage',
                'admin.audit.view', 'admin.audit.investigate', 'admin.expenses.manage',
                'admin.investors.manage', 'admin.support.manage',
            ],
            AdminRole::BillingManager->value => [
                'admin.billing.manage', 'admin.subscriptions.manage',
                'admin.expenses.manage', 'admin.investors.manage',
            ],
            AdminRole::SupportAgent->value => [
                'admin.shops.manage', 'admin.users.manage',
                'admin.announcements.manage', 'admin.support.manage',
            ],
            AdminRole::Auditor->value => ['admin.audit.view', 'admin.investors.manage'],
        ];
    }
}
