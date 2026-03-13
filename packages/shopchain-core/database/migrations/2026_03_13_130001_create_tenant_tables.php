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
        Schema::create('shops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('owner_id')->constrained('users');
            $table->text('name');
            $table->text('type');
            $table->text('currency')->default('GHS');
            $table->text('timezone')->default('Africa/Accra');
            $table->decimal('tax_rate', 5, 2)->default(15);
            $table->text('tax_label')->default('VAT');
            $table->text('receipt_footer')->nullable();
            $table->integer('low_stock_threshold')->default(10);
            $table->text('logo_url')->nullable();
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->text('address')->nullable();
            $table->text('region')->nullable();
            $table->string('status')->default('active');
            $table->timestampsTz();

            $table->index('owner_id', 'idx_shops_owner');
            $table->index('status', 'idx_shops_status');
        });

        DB::statement("ALTER TABLE shops ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE shops ALTER COLUMN status TYPE shop_status USING status::shop_status");
        DB::statement("ALTER TABLE shops ALTER COLUMN status SET DEFAULT 'active'::shop_status");

        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->string('type')->default('retail');
            $table->foreignUuid('manager_id')->nullable()->constrained('users');
            $table->boolean('is_default')->default(false);
            $table->text('address')->nullable();
            $table->text('phone')->nullable();
            $table->string('status')->default('active');
            $table->timestampsTz();

            $table->unique(['shop_id', 'name']);
            $table->index('shop_id', 'idx_branches_shop');
        });

        DB::statement("ALTER TABLE branches ALTER COLUMN type DROP DEFAULT");
        DB::statement("ALTER TABLE branches ALTER COLUMN type TYPE branch_type USING type::branch_type");
        DB::statement("ALTER TABLE branches ALTER COLUMN type SET DEFAULT 'retail'::branch_type");
        DB::statement("ALTER TABLE branches ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE branches ALTER COLUMN status TYPE branch_status USING status::branch_status");
        DB::statement("ALTER TABLE branches ALTER COLUMN status SET DEFAULT 'active'::branch_status");

        Schema::create('shop_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('viewer');
            $table->string('status')->default('invited');
            $table->timestampTz('joined_at')->nullable();
            $table->timestampsTz();

            $table->unique(['user_id', 'shop_id']);
            $table->index('shop_id', 'idx_shop_members_shop');
            $table->index('user_id', 'idx_shop_members_user');
        });

        DB::statement("ALTER TABLE shop_members ALTER COLUMN role DROP DEFAULT");
        DB::statement("ALTER TABLE shop_members ALTER COLUMN role TYPE shop_role USING role::shop_role");
        DB::statement("ALTER TABLE shop_members ALTER COLUMN role SET DEFAULT 'viewer'::shop_role");
        DB::statement("ALTER TABLE shop_members ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE shop_members ALTER COLUMN status TYPE member_status USING status::member_status");
        DB::statement("ALTER TABLE shop_members ALTER COLUMN status SET DEFAULT 'invited'::member_status");

        Schema::create('branch_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('member_id')->constrained('shop_members')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('assigned_at')->useCurrent();
            $table->timestampsTz();

            $table->unique(['member_id', 'branch_id']);
            $table->index('branch_id', 'idx_branch_members_branch');
            $table->index('member_id', 'idx_branch_members_member');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_members');
        Schema::dropIfExists('shop_members');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('shops');
    }
};
