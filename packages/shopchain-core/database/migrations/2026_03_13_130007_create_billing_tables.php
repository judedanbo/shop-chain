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
        Schema::create('plans', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('name');
            $table->decimal('price', 10, 2)->default(0);
            $table->text('icon')->nullable();
            $table->text('color')->nullable();
            $table->text('badge')->nullable();
            $table->jsonb('limits')->default('{}');
            $table->jsonb('features')->default('{}');
            $table->string('lifecycle')->default('draft');
            $table->timestampTz('available_from')->nullable();
            $table->timestampTz('retire_at')->nullable();
            $table->timestampTz('migrate_at')->nullable();
            $table->text('fallback_id')->nullable();
            $table->boolean('grandfathered')->default(false);
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE plans ALTER COLUMN lifecycle DROP DEFAULT");
        DB::statement("ALTER TABLE plans ALTER COLUMN lifecycle TYPE plan_lifecycle USING lifecycle::plan_lifecycle");
        DB::statement("ALTER TABLE plans ALTER COLUMN lifecycle SET DEFAULT 'draft'::plan_lifecycle");
        DB::statement("ALTER TABLE plans ADD CONSTRAINT plans_fallback_id_foreign FOREIGN KEY (fallback_id) REFERENCES plans (id)");

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->text('plan_id');
            $table->string('status')->default('active');
            $table->timestampTz('started_at')->useCurrent();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->timestampsTz();

            $table->index('shop_id', 'idx_subscriptions_shop');
            $table->index('status', 'idx_subscriptions_status');
        });

        DB::statement("ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_foreign FOREIGN KEY (plan_id) REFERENCES plans (id)");
        DB::statement("ALTER TABLE subscriptions ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE subscriptions ALTER COLUMN status TYPE subscription_status USING status::subscription_status");
        DB::statement("ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'active'::subscription_status");
        DB::statement("CREATE UNIQUE INDEX idx_subscriptions_active ON subscriptions (shop_id) WHERE status = 'active'");

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->text('provider');
            $table->text('last4');
            $table->text('display_name');
            $table->boolean('is_default')->default(false);
            $table->text('expiry')->nullable();
            $table->text('status')->default('active');
            $table->timestampTz('added_at')->useCurrent();
            $table->timestampsTz();

            $table->index('user_id', 'idx_payment_methods_user');
        });

        DB::statement("ALTER TABLE payment_methods ALTER COLUMN type TYPE pay_type USING type::pay_type");

        Schema::create('billing_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('subscription_id')->nullable()->constrained();
            $table->decimal('amount', 10, 2);
            $table->foreignUuid('method_id')->nullable()->constrained('payment_methods');
            $table->string('status')->default('pending');
            $table->text('tx_ref')->nullable();
            $table->text('note')->nullable();
            $table->timestampsTz();

            $table->index('shop_id', 'idx_billing_shop');
            $table->index('status', 'idx_billing_status');
        });

        DB::statement("ALTER TABLE billing_records ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE billing_records ALTER COLUMN status TYPE billing_status USING status::billing_status");
        DB::statement("ALTER TABLE billing_records ALTER COLUMN status SET DEFAULT 'pending'::billing_status");
        DB::statement("CREATE INDEX idx_billing_created ON billing_records (shop_id, created_at DESC)");

        Schema::create('billing_exemptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('granted_by')->constrained('users');
            $table->integer('period')->nullable();
            $table->string('unit')->nullable();
            $table->boolean('unlimited')->default(false);
            $table->text('reason');
            $table->timestampTz('starts_at')->useCurrent();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampsTz();

            $table->index('shop_id', 'idx_exemptions_shop');
        });

        DB::statement("ALTER TABLE billing_exemptions ALTER COLUMN unit TYPE exemption_unit USING unit::exemption_unit");
        DB::statement("CREATE INDEX idx_exemptions_active ON billing_exemptions (shop_id, expires_at) WHERE expires_at IS NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billing_exemptions');
        Schema::dropIfExists('billing_records');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
    }
};
