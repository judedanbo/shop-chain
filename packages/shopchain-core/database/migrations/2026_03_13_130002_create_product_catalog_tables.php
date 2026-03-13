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
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->text('icon')->nullable();
            $table->text('color')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->integer('sort_order')->default(0);
            $table->timestampsTz();

            $table->unique(['shop_id', 'name']);
            $table->index('shop_id', 'idx_categories_shop');
        });

        DB::statement("ALTER TABLE categories ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE categories ALTER COLUMN status TYPE category_status USING status::category_status");
        DB::statement("ALTER TABLE categories ALTER COLUMN status SET DEFAULT 'active'::category_status");

        Schema::create('units_of_measure', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->text('abbreviation');
            $table->string('type');
            $table->text('description')->nullable();
            $table->timestampsTz();

            $table->unique(['shop_id', 'abbreviation']);
            $table->index('shop_id', 'idx_units_shop');
        });

        DB::statement("ALTER TABLE units_of_measure ALTER COLUMN type TYPE unit_type USING type::unit_type");

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('sku');
            $table->text('name');
            $table->text('description')->nullable();
            $table->text('barcode')->nullable();
            $table->foreignUuid('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('unit_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('cost', 12, 2)->default(0);
            $table->integer('reorder_level')->default(0);
            $table->text('image_url')->nullable();
            $table->date('expiry_date')->nullable();
            $table->boolean('batch_tracking')->default(false);
            $table->boolean('skip_kitchen')->default(false);
            $table->string('status')->default('in_stock');
            $table->timestampsTz();

            $table->unique(['shop_id', 'sku']);
            $table->index('shop_id', 'idx_products_shop');
            $table->index('category_id', 'idx_products_category');
        });

        DB::statement("ALTER TABLE products ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE products ALTER COLUMN status TYPE product_status USING status::product_status");
        DB::statement("ALTER TABLE products ALTER COLUMN status SET DEFAULT 'in_stock'::product_status");
        DB::statement("CREATE INDEX idx_products_barcode ON products (barcode) WHERE barcode IS NOT NULL");
        DB::statement("CREATE INDEX idx_products_status ON products (shop_id, status)");

        Schema::create('warehouses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->string('type')->default('main_storage');
            $table->foreignUuid('manager_id')->nullable()->constrained('users');
            $table->text('address')->nullable();
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->integer('capacity')->nullable();
            $table->text('zones')->nullable();
            $table->string('status')->default('active');
            $table->timestampsTz();

            $table->unique(['shop_id', 'name']);
            $table->index('shop_id', 'idx_warehouses_shop');
        });

        DB::statement("ALTER TABLE warehouses ALTER COLUMN type DROP DEFAULT");
        DB::statement("ALTER TABLE warehouses ALTER COLUMN type TYPE warehouse_type USING type::warehouse_type");
        DB::statement("ALTER TABLE warehouses ALTER COLUMN type SET DEFAULT 'main_storage'::warehouse_type");
        DB::statement("ALTER TABLE warehouses ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE warehouses ALTER COLUMN status TYPE warehouse_status USING status::warehouse_status");
        DB::statement("ALTER TABLE warehouses ALTER COLUMN status SET DEFAULT 'active'::warehouse_status");
        DB::statement("ALTER TABLE warehouses ALTER COLUMN zones TYPE TEXT[] USING CASE WHEN zones IS NULL THEN NULL ELSE string_to_array(zones, ',') END");

        Schema::create('product_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained()->cascadeOnDelete();
            $table->integer('quantity')->default(0);
            $table->timestampTz('last_counted_at')->nullable();
            $table->timestampTz('updated_at')->useCurrent();

            $table->unique(['product_id', 'warehouse_id', 'branch_id']);
            $table->index('product_id', 'idx_product_locations_product');
            $table->index('warehouse_id', 'idx_product_locations_warehouse');
            $table->index('branch_id', 'idx_product_locations_branch');
        });

        DB::statement("ALTER TABLE product_locations ADD CONSTRAINT product_locations_location_check CHECK (warehouse_id IS NOT NULL OR branch_id IS NOT NULL)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_locations');
        Schema::dropIfExists('warehouses');
        Schema::dropIfExists('products');
        Schema::dropIfExists('units_of_measure');
        Schema::dropIfExists('categories');
    }
};
