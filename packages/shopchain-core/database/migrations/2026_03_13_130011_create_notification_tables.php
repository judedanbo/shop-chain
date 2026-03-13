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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->text('title');
            $table->text('message');
            $table->string('category');
            $table->string('priority')->default('medium');
            $table->text('channels')->default('{in_app}');
            $table->boolean('is_read')->default(false);
            $table->text('action_url')->nullable();
            $table->jsonb('action_data')->nullable();
            $table->foreignUuid('actor_id')->nullable()->constrained('users');
            $table->text('actor_role')->nullable();
            $table->boolean('requires_action')->default(false);
            $table->string('action_taken')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('user_id', 'idx_notifications_user');
            $table->index('shop_id', 'idx_notifications_shop');
        });

        DB::statement("ALTER TABLE notifications ALTER COLUMN category TYPE notif_category USING category::notif_category");
        DB::statement("ALTER TABLE notifications ALTER COLUMN priority DROP DEFAULT");
        DB::statement("ALTER TABLE notifications ALTER COLUMN priority TYPE notif_priority USING priority::notif_priority");
        DB::statement("ALTER TABLE notifications ALTER COLUMN priority SET DEFAULT 'medium'::notif_priority");
        DB::statement("ALTER TABLE notifications ALTER COLUMN channels DROP DEFAULT");
        DB::statement("ALTER TABLE notifications ALTER COLUMN channels TYPE notif_channel[] USING channels::notif_channel[]");
        DB::statement("ALTER TABLE notifications ALTER COLUMN channels SET DEFAULT '{in_app}'");
        DB::statement("ALTER TABLE notifications ALTER COLUMN action_taken TYPE notif_action USING action_taken::notif_action");
        DB::statement("CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read) WHERE is_read = FALSE");
        DB::statement("CREATE INDEX idx_notifications_created ON notifications (user_id, created_at DESC)");

        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->jsonb('categories')->default('{}');
            $table->boolean('quiet_hours_enabled')->default(false);
            $table->time('quiet_hours_start')->default('22:00');
            $table->time('quiet_hours_end')->default('07:00');
            $table->timestampsTz();

            $table->index('user_id', 'idx_notif_prefs_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications');
    }
};
