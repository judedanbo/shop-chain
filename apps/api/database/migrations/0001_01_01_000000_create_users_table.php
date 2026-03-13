<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('name');
            $table->text('email')->unique();
            $table->text('phone')->nullable();
            $table->text('password');
            $table->text('avatar_url')->nullable();
            $table->string('status')->default('pending');
            $table->timestampTz('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestampTz('last_active_at')->nullable();
            $table->timestampsTz();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestampTz('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->text('device');
            $table->ipAddress('ip_address')->nullable();
            $table->text('location')->nullable();
            $table->boolean('is_current')->default(false);
            $table->timestampTz('last_active')->useCurrent();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('expires_at')->nullable();

            $table->index('user_id', 'idx_sessions_user');
            $table->index(['user_id', 'last_active'], 'idx_sessions_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
