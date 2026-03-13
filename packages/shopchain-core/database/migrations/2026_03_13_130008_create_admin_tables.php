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
        Schema::create('admin_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->string('status')->default('invited');
            $table->boolean('two_fa_enabled')->default(false);
            $table->foreignUuid('created_by')->nullable()->constrained('users');
            $table->timestampTz('last_login_at')->nullable();
            $table->timestampsTz();

            $table->index('role', 'idx_admin_users_role');
        });

        DB::statement("ALTER TABLE admin_users ALTER COLUMN role TYPE admin_role USING role::admin_role");
        DB::statement("ALTER TABLE admin_users ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE admin_users ALTER COLUMN status TYPE admin_team_status USING status::admin_team_status");
        DB::statement("ALTER TABLE admin_users ALTER COLUMN status SET DEFAULT 'invited'::admin_team_status");

        Schema::create('announcements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('title');
            $table->text('body');
            $table->string('target')->default('all');
            $table->string('priority')->default('info');
            $table->string('status')->default('draft');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestampsTz();

            $table->index('status', 'idx_announcements_status');
            $table->index('target', 'idx_announcements_target');
        });

        DB::statement("ALTER TABLE announcements ALTER COLUMN target DROP DEFAULT");
        DB::statement("ALTER TABLE announcements ALTER COLUMN target TYPE announcement_target USING target::announcement_target");
        DB::statement("ALTER TABLE announcements ALTER COLUMN target SET DEFAULT 'all'::announcement_target");
        DB::statement("ALTER TABLE announcements ALTER COLUMN priority DROP DEFAULT");
        DB::statement("ALTER TABLE announcements ALTER COLUMN priority TYPE announcement_priority USING priority::announcement_priority");
        DB::statement("ALTER TABLE announcements ALTER COLUMN priority SET DEFAULT 'info'::announcement_priority");
        DB::statement("ALTER TABLE announcements ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE announcements ALTER COLUMN status TYPE announcement_status USING status::announcement_status");
        DB::statement("ALTER TABLE announcements ALTER COLUMN status SET DEFAULT 'draft'::announcement_status");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('admin_users');
    }
};
