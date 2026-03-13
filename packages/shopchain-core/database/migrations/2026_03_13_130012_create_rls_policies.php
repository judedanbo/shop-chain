<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tables with direct shop_id column.
     */
    private array $shopScopedTables = [
        'branches',
        'shop_members',
        'categories',
        'units_of_measure',
        'products',
        'warehouses',
        'batches',
        'stock_adjustments',
        'stock_transfers',
        'price_history',
        'goods_receipts',
        'suppliers',
        'purchase_orders',
        'customers',
        'tills',
        'sales',
        'kitchen_orders',
        'held_orders',
        'pos_held_orders',
        'subscriptions',
        'billing_records',
        'billing_exemptions',
        'notifications',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->shopScopedTables as $table) {
            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY");

            DB::statement("
                CREATE POLICY {$table}_tenant_isolation ON {$table}
                USING (shop_id = current_setting('app.current_shop_id')::UUID)
            ");

            DB::statement("
                CREATE POLICY {$table}_tenant_insert ON {$table}
                FOR INSERT
                WITH CHECK (shop_id = current_setting('app.current_shop_id')::UUID)
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (array_reverse($this->shopScopedTables) as $table) {
            DB::statement("DROP POLICY IF EXISTS {$table}_tenant_insert ON {$table}");
            DB::statement("DROP POLICY IF EXISTS {$table}_tenant_isolation ON {$table}");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
        }
    }
};
