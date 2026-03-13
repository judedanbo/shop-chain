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
        Schema::create('kitchen_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained();
            $table->foreignUuid('till_id')->constrained();
            $table->foreignUuid('sale_id')->nullable()->constrained();
            $table->text('table_number')->nullable();
            $table->string('order_type')->default('dine_in');
            $table->string('status')->default('pending');
            $table->decimal('total', 12, 2)->nullable();
            $table->boolean('bar_fulfilled')->default(false);
            $table->foreignUuid('server_id')->nullable()->constrained('users');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('accepted_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestampTz('served_at')->nullable();
            $table->timestampTz('returned_at')->nullable();
            $table->text('return_reason')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->foreignUuid('cancelled_by')->nullable()->constrained('users');
            $table->timestampTz('updated_at')->useCurrent();

            $table->index('shop_id', 'idx_kitchen_orders_shop');
            $table->index('branch_id', 'idx_kitchen_orders_branch');
            $table->index('till_id', 'idx_kitchen_orders_till');
        });

        DB::statement("ALTER TABLE kitchen_orders ALTER COLUMN order_type DROP DEFAULT");
        DB::statement("ALTER TABLE kitchen_orders ALTER COLUMN order_type TYPE order_type USING order_type::order_type");
        DB::statement("ALTER TABLE kitchen_orders ALTER COLUMN order_type SET DEFAULT 'dine_in'::order_type");
        DB::statement("ALTER TABLE kitchen_orders ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE kitchen_orders ALTER COLUMN status TYPE kitchen_order_status USING status::kitchen_order_status");
        DB::statement("ALTER TABLE kitchen_orders ALTER COLUMN status SET DEFAULT 'pending'::kitchen_order_status");
        DB::statement("CREATE INDEX idx_kitchen_orders_status ON kitchen_orders (shop_id, status)");

        Schema::create('kitchen_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('kitchen_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained();
            $table->integer('quantity');
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestampTz('served_at')->nullable();

            $table->index('order_id', 'idx_kitchen_items_order');
        });

        DB::statement("ALTER TABLE kitchen_order_items ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE kitchen_order_items ALTER COLUMN status TYPE kitchen_item_status USING status::kitchen_item_status");
        DB::statement("ALTER TABLE kitchen_order_items ALTER COLUMN status SET DEFAULT 'pending'::kitchen_item_status");

        Schema::create('held_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('till_id')->constrained();
            $table->text('table_number')->nullable();
            $table->string('order_type')->default('dine_in');
            $table->text('label')->nullable();
            $table->timestampTz('held_at')->useCurrent();
            $table->timestampsTz();

            $table->index('till_id', 'idx_held_orders_till');
        });

        DB::statement("ALTER TABLE held_orders ALTER COLUMN order_type DROP DEFAULT");
        DB::statement("ALTER TABLE held_orders ALTER COLUMN order_type TYPE order_type USING order_type::order_type");
        DB::statement("ALTER TABLE held_orders ALTER COLUMN order_type SET DEFAULT 'dine_in'::order_type");

        Schema::create('held_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('held_order_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained();
            $table->integer('quantity');
            $table->text('notes')->nullable();

            $table->index('held_order_id', 'idx_held_items_order');
        });

        Schema::create('till_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('till_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('order_id')->constrained('kitchen_orders');
            $table->decimal('amount', 12, 2);
            $table->string('method');
            $table->timestampTz('paid_at')->useCurrent();
            $table->decimal('amount_tendered', 12, 2)->nullable();
            $table->decimal('change_given', 12, 2)->nullable();
            $table->text('card_type')->nullable();
            $table->text('card_trans_no')->nullable();
            $table->text('momo_provider')->nullable();
            $table->text('momo_phone')->nullable();
            $table->text('momo_trans_id')->nullable();

            $table->index('till_id', 'idx_till_payments_till');
            $table->index('order_id', 'idx_till_payments_order');
        });

        DB::statement("ALTER TABLE till_payments ALTER COLUMN method TYPE till_pay_method USING method::till_pay_method");

        Schema::create('pos_held_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained();
            $table->foreignUuid('held_by')->constrained('users');
            $table->text('discount_value')->nullable();
            $table->string('discount_type')->nullable();
            $table->timestampTz('held_at')->useCurrent();

            $table->index('shop_id', 'idx_pos_held_shop');
            $table->index('branch_id', 'idx_pos_held_branch');
        });

        DB::statement("ALTER TABLE pos_held_orders ALTER COLUMN discount_type TYPE discount_type USING discount_type::discount_type");

        Schema::create('pos_held_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('held_order_id')->constrained('pos_held_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained();
            $table->integer('quantity');

            $table->index('held_order_id', 'idx_pos_held_items_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_held_order_items');
        Schema::dropIfExists('pos_held_orders');
        Schema::dropIfExists('till_payments');
        Schema::dropIfExists('held_order_items');
        Schema::dropIfExists('held_orders');
        Schema::dropIfExists('kitchen_order_items');
        Schema::dropIfExists('kitchen_orders');
    }
};
