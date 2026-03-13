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
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->string('type')->default('regular');
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->integer('visits')->default(0);
            $table->timestampTz('last_visit')->nullable();
            $table->integer('loyalty_pts')->default(0);
            $table->text('notes')->nullable();
            $table->timestampsTz();

            $table->index('shop_id', 'idx_customers_shop');
        });

        DB::statement("ALTER TABLE customers ALTER COLUMN type DROP DEFAULT");
        DB::statement("ALTER TABLE customers ALTER COLUMN type TYPE customer_type USING type::customer_type");
        DB::statement("ALTER TABLE customers ALTER COLUMN type SET DEFAULT 'regular'::customer_type");
        DB::statement("CREATE INDEX idx_customers_phone ON customers (shop_id, phone) WHERE phone IS NOT NULL");

        Schema::create('tills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->foreignUuid('opened_by')->constrained('users');
            $table->timestampTz('opened_at')->useCurrent();
            $table->timestampTz('closed_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('discount', 12, 2)->nullable();
            $table->string('discount_type')->nullable();
            $table->decimal('discount_input', 12, 2)->nullable();
            $table->timestampsTz();

            $table->index('branch_id', 'idx_tills_branch');
        });

        DB::statement("ALTER TABLE tills ALTER COLUMN discount_type TYPE discount_type USING discount_type::discount_type");
        DB::statement("CREATE INDEX idx_tills_active ON tills (shop_id, is_active) WHERE is_active = TRUE");

        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained();
            $table->foreignUuid('till_id')->nullable()->constrained();
            $table->foreignUuid('cashier_id')->constrained('users');
            $table->foreignUuid('customer_id')->nullable()->constrained();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->string('discount_type')->nullable();
            $table->decimal('discount_input', 12, 2)->nullable();
            $table->decimal('total', 12, 2);
            $table->string('status')->default('completed');
            $table->string('source')->default('pos');
            $table->text('verify_token')->nullable();
            $table->timestampTz('reversed_at')->nullable();
            $table->foreignUuid('reversed_by')->nullable()->constrained('users');
            $table->text('reversal_reason')->nullable();
            $table->foreignUuid('reversal_requested_by')->nullable()->constrained('users');
            $table->timestampTz('reversal_requested_at')->nullable();
            $table->timestampsTz();

            $table->index('shop_id', 'idx_sales_shop');
            $table->index('branch_id', 'idx_sales_branch');
            $table->index('cashier_id', 'idx_sales_cashier');
        });

        DB::statement("ALTER TABLE sales ALTER COLUMN discount_type TYPE discount_type USING discount_type::discount_type");
        DB::statement("ALTER TABLE sales ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE sales ALTER COLUMN status TYPE sale_status USING status::sale_status");
        DB::statement("ALTER TABLE sales ALTER COLUMN status SET DEFAULT 'completed'::sale_status");
        DB::statement("ALTER TABLE sales ALTER COLUMN source DROP DEFAULT");
        DB::statement("ALTER TABLE sales ALTER COLUMN source TYPE sale_source USING source::sale_source");
        DB::statement("ALTER TABLE sales ALTER COLUMN source SET DEFAULT 'pos'::sale_source");
        DB::statement("CREATE INDEX idx_sales_customer ON sales (customer_id) WHERE customer_id IS NOT NULL");
        DB::statement("CREATE INDEX idx_sales_created ON sales (shop_id, created_at DESC)");
        DB::statement("CREATE INDEX idx_sales_status ON sales (shop_id, status)");

        Schema::create('sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->string('discount_type')->nullable();
            $table->decimal('line_total', 12, 2);
            $table->foreignUuid('batch_id')->nullable()->constrained('batches');

            $table->index('sale_id', 'idx_sale_items_sale');
            $table->index('product_id', 'idx_sale_items_product');
        });

        DB::statement("ALTER TABLE sale_items ALTER COLUMN discount_type TYPE discount_type USING discount_type::discount_type");

        Schema::create('sale_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')->constrained()->cascadeOnDelete();
            $table->string('method');
            $table->text('label')->nullable();
            $table->decimal('amount', 12, 2);
            $table->decimal('amount_tendered', 12, 2)->nullable();
            $table->decimal('change_given', 12, 2)->nullable();
            $table->text('card_type')->nullable();
            $table->text('card_trans_no')->nullable();
            $table->text('momo_provider')->nullable();
            $table->text('momo_phone')->nullable();
            $table->text('momo_ref')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('sale_id', 'idx_sale_payments_sale');
        });

        DB::statement("ALTER TABLE sale_payments ALTER COLUMN method TYPE pay_method USING method::pay_method");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('tills');
        Schema::dropIfExists('customers');
    }
};
