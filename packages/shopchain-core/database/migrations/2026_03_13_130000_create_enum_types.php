<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop any orphaned types left by migrate:fresh (which drops tables but not types)
        $types = [
            'user_status', 'shop_status', 'branch_type', 'branch_status',
            'member_status', 'category_status', 'warehouse_status', 'warehouse_type',
            'shop_role', 'admin_role', 'product_status', 'batch_status',
            'adjustment_type', 'adjustment_status', 'transfer_status', 'unit_type',
            'goods_receipt_status', 'batch_condition', 'supplier_status', 'po_status',
            'payment_terms', 'sale_status', 'sale_source', 'pay_method',
            'till_pay_method', 'discount_type', 'customer_type', 'order_type',
            'kitchen_order_status', 'kitchen_item_status', 'plan_lifecycle',
            'subscription_status', 'billing_status', 'pay_type', 'exemption_unit',
            'admin_team_status', 'announcement_target', 'announcement_priority',
            'announcement_status', 'audit_category', 'risk_level', 'investigation_status',
            'anomaly_status', 'expense_category', 'notif_category', 'notif_priority',
            'notif_channel', 'notif_action',
        ];

        foreach ($types as $type) {
            DB::statement("DROP TYPE IF EXISTS {$type} CASCADE");
        }

        // Identity & tenancy
        DB::statement("CREATE TYPE user_status AS ENUM ('active', 'inactive', 'deactivated', 'pending', 'suspended')");
        DB::statement("CREATE TYPE shop_status AS ENUM ('active', 'suspended', 'pending')");
        DB::statement("CREATE TYPE branch_type AS ENUM ('retail', 'warehouse', 'distribution')");
        DB::statement("CREATE TYPE branch_status AS ENUM ('active', 'inactive')");
        DB::statement("CREATE TYPE member_status AS ENUM ('active', 'invited', 'suspended', 'removed')");
        DB::statement("CREATE TYPE category_status AS ENUM ('active', 'inactive')");
        DB::statement("CREATE TYPE warehouse_status AS ENUM ('active', 'inactive')");
        DB::statement("CREATE TYPE warehouse_type AS ENUM ('main_storage', 'secondary', 'retail')");
        DB::statement("CREATE TYPE shop_role AS ENUM ('owner', 'general_manager', 'manager', 'bar_manager', 'waiter', 'kitchen_staff', 'inventory_manager', 'inventory_officer', 'salesperson', 'cashier', 'accountant', 'viewer')");
        DB::statement("CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'billing_manager', 'support_agent', 'auditor')");

        // Product & inventory
        DB::statement("CREATE TYPE product_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock')");
        DB::statement("CREATE TYPE batch_status AS ENUM ('active', 'expired', 'depleted')");
        DB::statement("CREATE TYPE adjustment_type AS ENUM ('damage', 'recount', 'expired', 'theft', 'return')");
        DB::statement("CREATE TYPE adjustment_status AS ENUM ('pending', 'approved', 'rejected')");
        DB::statement("CREATE TYPE transfer_status AS ENUM ('pending', 'in_transit', 'completed', 'cancelled')");
        DB::statement("CREATE TYPE unit_type AS ENUM ('weight', 'volume', 'count', 'length')");
        DB::statement("CREATE TYPE goods_receipt_status AS ENUM ('draft', 'completed')");
        DB::statement("CREATE TYPE batch_condition AS ENUM ('good', 'damaged', 'short_ship')");

        // Suppliers & purchase orders
        DB::statement("CREATE TYPE supplier_status AS ENUM ('active', 'inactive')");
        DB::statement("CREATE TYPE po_status AS ENUM ('draft', 'pending', 'approved', 'shipped', 'partial', 'received', 'cancelled')");
        DB::statement("CREATE TYPE payment_terms AS ENUM ('cod', 'net15', 'net30', 'net60')");

        // Sales & POS
        DB::statement("CREATE TYPE sale_status AS ENUM ('completed', 'reversed', 'pending_reversal')");
        DB::statement("CREATE TYPE sale_source AS ENUM ('pos', 'bar')");
        DB::statement("CREATE TYPE pay_method AS ENUM ('cash', 'card', 'momo', 'split')");
        DB::statement("CREATE TYPE till_pay_method AS ENUM ('cash', 'card', 'momo')");
        DB::statement("CREATE TYPE discount_type AS ENUM ('percent', 'fixed')");
        DB::statement("CREATE TYPE customer_type AS ENUM ('regular', 'wholesale', 'walk-in')");

        // Kitchen
        DB::statement("CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway')");
        DB::statement("CREATE TYPE kitchen_order_status AS ENUM ('pending', 'accepted', 'completed', 'served', 'rejected', 'cancelled', 'returned')");
        DB::statement("CREATE TYPE kitchen_item_status AS ENUM ('pending', 'served')");

        // Billing
        DB::statement("CREATE TYPE plan_lifecycle AS ENUM ('draft', 'scheduled', 'active', 'retiring', 'retired')");
        DB::statement("CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'expired')");
        DB::statement("CREATE TYPE billing_status AS ENUM ('paid', 'failed', 'refunded', 'pending')");
        DB::statement("CREATE TYPE pay_type AS ENUM ('momo', 'card')");
        DB::statement("CREATE TYPE exemption_unit AS ENUM ('months', 'years')");

        // Admin & audit
        DB::statement("CREATE TYPE admin_team_status AS ENUM ('active', 'invited', 'suspended')");
        DB::statement("CREATE TYPE announcement_target AS ENUM ('all', 'free', 'basic', 'max')");
        DB::statement("CREATE TYPE announcement_priority AS ENUM ('info', 'warning', 'critical')");
        DB::statement("CREATE TYPE announcement_status AS ENUM ('active', 'draft')");
        DB::statement("CREATE TYPE audit_category AS ENUM ('auth', 'financial', 'data', 'admin', 'system')");
        DB::statement("CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical')");
        DB::statement("CREATE TYPE investigation_status AS ENUM ('open', 'in_progress', 'escalated', 'closed')");
        DB::statement("CREATE TYPE anomaly_status AS ENUM ('escalated', 'reviewing', 'resolved', 'dismissed')");
        DB::statement("CREATE TYPE expense_category AS ENUM ('infrastructure', 'payment_fees', 'sms', 'staff', 'marketing', 'software', 'office', 'compliance')");

        // Notifications
        DB::statement("CREATE TYPE notif_category AS ENUM ('stock_alert', 'order_update', 'sale_event', 'approval_request', 'team_update', 'system', 'customer')");
        DB::statement("CREATE TYPE notif_priority AS ENUM ('low', 'medium', 'high', 'critical')");
        DB::statement("CREATE TYPE notif_channel AS ENUM ('in_app', 'push', 'email', 'sms')");
        DB::statement("CREATE TYPE notif_action AS ENUM ('approved', 'rejected', 'acknowledged')");

        // Cast users.status to PG enum (must drop default first, then re-add)
        DB::statement("ALTER TABLE users ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE users ALTER COLUMN status TYPE user_status USING status::user_status");
        DB::statement("ALTER TABLE users ALTER COLUMN status SET DEFAULT 'pending'::user_status");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE users ALTER COLUMN status TYPE varchar USING status::varchar");

        $types = [
            'notif_action', 'notif_channel', 'notif_priority', 'notif_category',
            'expense_category', 'anomaly_status', 'investigation_status', 'risk_level',
            'audit_category', 'announcement_status', 'announcement_priority', 'announcement_target',
            'admin_team_status', 'exemption_unit', 'pay_type', 'billing_status',
            'subscription_status', 'plan_lifecycle', 'kitchen_item_status', 'kitchen_order_status',
            'order_type', 'customer_type', 'discount_type', 'till_pay_method', 'pay_method',
            'sale_source', 'sale_status', 'payment_terms', 'po_status', 'supplier_status',
            'batch_condition', 'goods_receipt_status', 'unit_type', 'transfer_status',
            'adjustment_status', 'adjustment_type', 'batch_status', 'product_status',
            'admin_role', 'shop_role', 'warehouse_type', 'warehouse_status',
            'category_status', 'member_status', 'branch_status', 'branch_type',
            'shop_status', 'user_status',
        ];

        foreach ($types as $type) {
            DB::statement("DROP TYPE IF EXISTS {$type}");
        }
    }
};
