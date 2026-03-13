<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('batch_number');
            $table->integer('quantity')->default(0);
            $table->integer('initial_quantity');
            $table->date('expiry_date')->nullable();
            $table->date('received_date')->useCurrent();
            $table->foreignUuid('source_po_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->text('location')->nullable();
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->timestampsTz();

            $table->unique(['shop_id', 'batch_number']);
            $table->index('product_id', 'idx_batches_product');
            $table->index('shop_id', 'idx_batches_shop');
        });

        DB::statement("ALTER TABLE batches ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE batches ALTER COLUMN status TYPE batch_status USING status::batch_status");
        DB::statement("ALTER TABLE batches ALTER COLUMN status SET DEFAULT 'active'::batch_status");
        DB::statement("CREATE INDEX idx_batches_expiry ON batches (expiry_date) WHERE status = 'active'");

        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('batch_id')->nullable()->constrained('batches');
            $table->foreignUuid('warehouse_id')->nullable()->constrained();
            $table->foreignUuid('branch_id')->nullable()->constrained();
            $table->string('type');
            $table->integer('quantity_change');
            $table->date('adjustment_date')->useCurrent();
            $table->text('reason');
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->foreignUuid('created_by')->constrained('users');
            $table->foreignUuid('approved_by')->nullable()->constrained('users');
            $table->timestampsTz();
            $table->timestampTz('approved_at')->nullable();

            $table->index('shop_id', 'idx_adjustments_shop');
            $table->index('product_id', 'idx_adjustments_product');
        });

        DB::statement("ALTER TABLE stock_adjustments ALTER COLUMN type TYPE adjustment_type USING type::adjustment_type");
        DB::statement("ALTER TABLE stock_adjustments ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE stock_adjustments ALTER COLUMN status TYPE adjustment_status USING status::adjustment_status");
        DB::statement("ALTER TABLE stock_adjustments ALTER COLUMN status SET DEFAULT 'pending'::adjustment_status");
        DB::statement("CREATE INDEX idx_adjustments_status ON stock_adjustments (shop_id, status)");

        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('from_warehouse_id')->nullable()->constrained('warehouses');
            $table->foreignUuid('to_warehouse_id')->nullable()->constrained('warehouses');
            $table->foreignUuid('from_branch_id')->nullable()->constrained('branches');
            $table->foreignUuid('to_branch_id')->nullable()->constrained('branches');
            $table->integer('quantity');
            $table->string('status')->default('pending');
            $table->foreignUuid('created_by')->constrained('users');
            $table->foreignUuid('approved_by')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->timestampTz('shipped_at')->nullable();
            $table->timestampTz('received_at')->nullable();

            $table->index('shop_id', 'idx_transfers_shop');
        });

        DB::statement("ALTER TABLE stock_transfers ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE stock_transfers ALTER COLUMN status TYPE transfer_status USING status::transfer_status");
        DB::statement("ALTER TABLE stock_transfers ALTER COLUMN status SET DEFAULT 'pending'::transfer_status");
        DB::statement("ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_from_check CHECK (from_warehouse_id IS NOT NULL OR from_branch_id IS NOT NULL)");
        DB::statement("ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_to_check CHECK (to_warehouse_id IS NOT NULL OR to_branch_id IS NOT NULL)");
        DB::statement("CREATE INDEX idx_transfers_status ON stock_transfers (shop_id, status)");

        Schema::create('price_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->decimal('old_price', 12, 2);
            $table->decimal('new_price', 12, 2);
            $table->decimal('old_cost', 12, 2);
            $table->decimal('new_cost', 12, 2);
            $table->text('reason')->nullable();
            $table->foreignUuid('changed_by')->constrained('users');
            $table->text('status')->default('approved');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('product_id', 'idx_price_history_product');
            $table->index('shop_id', 'idx_price_history_shop');
        });

        DB::statement("CREATE INDEX idx_price_history_created ON price_history (product_id, created_at DESC)");

        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('reference');
            $table->foreignUuid('warehouse_id')->constrained();
            $table->date('receipt_date')->useCurrent();
            $table->text('notes')->nullable();
            $table->string('status')->default('completed');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestampsTz();

            $table->unique(['shop_id', 'reference']);
            $table->index('shop_id', 'idx_goods_receipts_shop');
            $table->index('warehouse_id', 'idx_goods_receipts_warehouse');
        });

        DB::statement("ALTER TABLE goods_receipts ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE goods_receipts ALTER COLUMN status TYPE goods_receipt_status USING status::goods_receipt_status");
        DB::statement("ALTER TABLE goods_receipts ALTER COLUMN status SET DEFAULT 'completed'::goods_receipt_status");

        Schema::create('goods_receipt_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('receipt_id')->constrained('goods_receipts')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained();
            $table->integer('quantity');
            $table->text('batch_number')->nullable();
            $table->string('condition')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();

            $table->index('receipt_id', 'idx_gr_items_receipt');
            $table->index('product_id', 'idx_gr_items_product');
        });

        DB::statement("ALTER TABLE goods_receipt_items ALTER COLUMN condition TYPE batch_condition USING condition::batch_condition");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_items');
        Schema::dropIfExists('goods_receipts');
        Schema::dropIfExists('price_history');
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('batches');
    }
};
