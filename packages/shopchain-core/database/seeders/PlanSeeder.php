<?php

namespace ShopChain\Core\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanSeeder extends Seeder
{
    /**
     * Seed the plans table.
     */
    public function run(): void
    {
        $now = now();

        DB::table('plans')->upsert([
            [
                'id' => 'free',
                'name' => 'Free',
                'price' => 0,
                'icon' => null,
                'color' => null,
                'badge' => null,
                'limits' => json_encode([
                    'shops' => 1,
                    'branchesPerShop' => 0,
                    'teamPerShop' => 3,
                    'productsPerShop' => 50,
                    'monthlyTransactions' => 200,
                    'storageMB' => 100,
                    'suppliers' => 5,
                    'warehouses' => 0,
                ]),
                'features' => json_encode([
                    'pos' => 'basic',
                    'receipts' => 'name_only',
                    'reports' => 'basic',
                    'barcode' => false,
                    'purchaseOrders' => 'view',
                    'stockTransfers' => false,
                    'lowStockAlerts' => false,
                    'twoFA' => false,
                    'apiAccess' => false,
                    'dataExport' => false,
                    'customBranding' => false,
                    'auditTrail' => 0,
                    'generalManager' => false,
                    'support' => 'community',
                ]),
                'lifecycle' => 'active',
                'available_from' => $now,
                'retire_at' => null,
                'migrate_at' => null,
                'fallback_id' => null,
                'grandfathered' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'basic',
                'name' => 'Basic',
                'price' => 49,
                'icon' => null,
                'color' => null,
                'badge' => null,
                'limits' => json_encode([
                    'shops' => 3,
                    'branchesPerShop' => 3,
                    'teamPerShop' => 15,
                    'productsPerShop' => 500,
                    'monthlyTransactions' => 5000,
                    'storageMB' => 2048,
                    'suppliers' => 50,
                    'warehouses' => 1,
                ]),
                'features' => json_encode([
                    'pos' => 'full',
                    'receipts' => 'logo_footer',
                    'reports' => 'advanced_csv',
                    'barcode' => true,
                    'purchaseOrders' => 'full',
                    'stockTransfers' => 'between_branches',
                    'lowStockAlerts' => 'email',
                    'twoFA' => true,
                    'apiAccess' => false,
                    'dataExport' => 'csv',
                    'customBranding' => false,
                    'auditTrail' => 30,
                    'generalManager' => false,
                    'support' => 'email_48h',
                ]),
                'lifecycle' => 'active',
                'available_from' => $now,
                'retire_at' => null,
                'migrate_at' => null,
                'fallback_id' => null,
                'grandfathered' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'max',
                'name' => 'Max',
                'price' => 149,
                'icon' => null,
                'color' => null,
                'badge' => null,
                'limits' => json_encode([
                    'shops' => -1,
                    'branchesPerShop' => -1,
                    'teamPerShop' => -1,
                    'productsPerShop' => -1,
                    'monthlyTransactions' => -1,
                    'storageMB' => 20480,
                    'suppliers' => -1,
                    'warehouses' => -1,
                ]),
                'features' => json_encode([
                    'pos' => 'full_split',
                    'receipts' => 'full_thermal',
                    'reports' => 'all_formats',
                    'barcode' => true,
                    'purchaseOrders' => 'full_auto_reorder',
                    'stockTransfers' => 'full',
                    'lowStockAlerts' => 'all_channels',
                    'twoFA' => true,
                    'apiAccess' => true,
                    'dataExport' => 'all_formats',
                    'customBranding' => true,
                    'auditTrail' => 365,
                    'generalManager' => true,
                    'support' => 'whatsapp_4h',
                ]),
                'lifecycle' => 'active',
                'available_from' => $now,
                'retire_at' => null,
                'migrate_at' => null,
                'fallback_id' => null,
                'grandfathered' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['id']);
    }
}
