<?php

namespace ShopChain\Core\Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Seed permissions and roles.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $guard = 'api';

        // --- Shop Permissions (36) ---
        $shopPermissions = [
            // Products (4)
            'products.view',
            'products.edit',
            'products.delete',
            'products.price',
            // Inventory (4)
            'inventory.view',
            'inventory.adjust',
            'inventory.transfer',
            'inventory.approve',
            // POS (3)
            'pos.access',
            'pos.discount',
            'pos.void',
            // Sales (3)
            'sales.view',
            'sales.reverse',
            'sales.export',
            // Kitchen (2)
            'kitchen.view',
            'kitchen.manage',
            // Suppliers (3)
            'suppliers.view',
            'suppliers.edit',
            'suppliers.delete',
            // Purchase Orders (3)
            'purchase_orders.view',
            'purchase_orders.create',
            'purchase_orders.approve',
            // Customers (3)
            'customers.view',
            'customers.edit',
            'customers.delete',
            // Reports (2)
            'reports.view',
            'reports.export',
            // Team (3)
            'team.view',
            'team.manage',
            'team.roles',
            // Settings (2)
            'settings.view',
            'settings.edit',
            // Branches (2)
            'branches.view',
            'branches.manage',
            // Warehouses (2)
            'warehouses.view',
            'warehouses.manage',
            // Notifications (3)
            'notifications.view',
            'notifications.manage',
            'notifications.preferences',
        ];

        // --- Admin Permissions (12) ---
        $adminPermissions = [
            'admin.shops.manage',
            'admin.users.manage',
            'admin.billing.manage',
            'admin.subscriptions.manage',
            'admin.announcements.manage',
            'admin.audit.view',
            'admin.audit.investigate',
            'admin.expenses.manage',
            'admin.team.manage',
            'admin.settings.manage',
            'admin.investors.manage',
            'admin.support.manage',
        ];

        // Create all permissions
        foreach (array_merge($shopPermissions, $adminPermissions) as $permission) {
            Permission::findOrCreate($permission, $guard);
        }

        // Reset cache after creating all permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // --- Shop Roles (12) ---
        $rolePermissions = [
            'owner' => $shopPermissions, // All shop permissions
            'general_manager' => $shopPermissions, // All shop permissions
            'manager' => [
                'products.view', 'products.edit', 'products.price',
                'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.approve',
                'pos.access', 'pos.discount', 'pos.void',
                'sales.view', 'sales.reverse', 'sales.export',
                'kitchen.view', 'kitchen.manage',
                'suppliers.view', 'suppliers.edit',
                'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.approve',
                'customers.view', 'customers.edit',
                'reports.view', 'reports.export',
                'team.view',
                'settings.view',
                'branches.view',
                'warehouses.view', 'warehouses.manage',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'bar_manager' => [
                'products.view',
                'inventory.view', 'inventory.adjust',
                'pos.access', 'pos.discount',
                'sales.view',
                'kitchen.view', 'kitchen.manage',
                'customers.view',
                'reports.view',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'waiter' => [
                'pos.access',
                'kitchen.view',
                'products.view',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'kitchen_staff' => [
                'kitchen.view', 'kitchen.manage',
                'products.view',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'inventory_manager' => [
                'products.view', 'products.edit',
                'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.approve',
                'suppliers.view', 'suppliers.edit',
                'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.approve',
                'warehouses.view', 'warehouses.manage',
                'reports.view',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'inventory_officer' => [
                'products.view',
                'inventory.view', 'inventory.adjust', 'inventory.transfer',
                'suppliers.view',
                'purchase_orders.view',
                'warehouses.view',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'salesperson' => [
                'pos.access',
                'products.view',
                'sales.view',
                'customers.view', 'customers.edit',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'cashier' => [
                'pos.access', 'pos.discount',
                'products.view',
                'sales.view',
                'customers.view',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'accountant' => [
                'sales.view', 'sales.export',
                'reports.view', 'reports.export',
                'products.view',
                'inventory.view',
                'purchase_orders.view',
                'customers.view',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
            'viewer' => [
                'products.view',
                'inventory.view',
                'sales.view',
                'reports.view',
                'customers.view',
                'suppliers.view',
                'purchase_orders.view',
                'branches.view',
                'warehouses.view',
                'team.view',
                'settings.view',
                'notifications.view', 'notifications.manage', 'notifications.preferences',
            ],
        ];

        foreach ($rolePermissions as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, $guard);
            $role->syncPermissions($permissions);
        }

        // --- Admin Roles (5) ---
        $adminRolePermissions = [
            'super_admin' => $adminPermissions, // all 12
            'admin' => [
                'admin.shops.manage', 'admin.users.manage', 'admin.billing.manage',
                'admin.subscriptions.manage', 'admin.announcements.manage',
                'admin.audit.view', 'admin.audit.investigate', 'admin.expenses.manage',
                'admin.investors.manage', 'admin.support.manage',
            ],
            'billing_manager' => [
                'admin.billing.manage', 'admin.subscriptions.manage',
                'admin.expenses.manage', 'admin.investors.manage',
            ],
            'support_agent' => [
                'admin.shops.manage', 'admin.users.manage',
                'admin.announcements.manage', 'admin.support.manage',
            ],
            'auditor' => ['admin.audit.view', 'admin.investors.manage'],
        ];

        foreach ($adminRolePermissions as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, $guard);
            $role->syncPermissions($permissions);
        }
    }
}
