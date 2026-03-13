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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->text('contact_name')->nullable();
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->text('address')->nullable();
            $table->decimal('rating', 2, 1)->default(0);
            $table->string('status')->default('active');
            $table->timestampsTz();

            $table->unique(['shop_id', 'name']);
            $table->index('shop_id', 'idx_suppliers_shop');
        });

        DB::statement("ALTER TABLE suppliers ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE suppliers ALTER COLUMN status TYPE supplier_status USING status::supplier_status");
        DB::statement("ALTER TABLE suppliers ALTER COLUMN status SET DEFAULT 'active'::supplier_status");

        Schema::create('supplier_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->integer('lead_time_days')->nullable();
            $table->boolean('is_preferred')->default(false);
            $table->timestampsTz();

            $table->unique(['supplier_id', 'product_id']);
            $table->index('product_id', 'idx_supplier_products_product');
            $table->index('supplier_id', 'idx_supplier_products_supplier');
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('supplier_id')->constrained();
            $table->foreignUuid('warehouse_id')->nullable()->constrained();
            $table->string('status')->default('draft');
            $table->string('payment_terms')->default('cod');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->foreignUuid('approved_by')->nullable()->constrained('users');
            $table->date('expected_date')->nullable();
            $table->date('received_date')->nullable();
            $table->timestampsTz();

            $table->index('shop_id', 'idx_po_shop');
            $table->index('supplier_id', 'idx_po_supplier');
        });

        DB::statement("ALTER TABLE purchase_orders ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE purchase_orders ALTER COLUMN status TYPE po_status USING status::po_status");
        DB::statement("ALTER TABLE purchase_orders ALTER COLUMN status SET DEFAULT 'draft'::po_status");
        DB::statement("ALTER TABLE purchase_orders ALTER COLUMN payment_terms DROP DEFAULT");
        DB::statement("ALTER TABLE purchase_orders ALTER COLUMN payment_terms TYPE payment_terms USING payment_terms::payment_terms");
        DB::statement("ALTER TABLE purchase_orders ALTER COLUMN payment_terms SET DEFAULT 'cod'::payment_terms");
        DB::statement("CREATE INDEX idx_po_status ON purchase_orders (shop_id, status)");

        Schema::create('po_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('po_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained();
            $table->integer('quantity_ordered');
            $table->integer('quantity_received')->default(0);
            $table->decimal('unit_cost', 12, 2);
            $table->foreignUuid('unit_id')->nullable()->constrained('units_of_measure');
            $table->date('expiry_date')->nullable();

            $table->unique(['po_id', 'product_id']);
            $table->index('po_id', 'idx_po_items_po');
            $table->index('product_id', 'idx_po_items_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('po_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('supplier_products');
        Schema::dropIfExists('suppliers');
    }
};
