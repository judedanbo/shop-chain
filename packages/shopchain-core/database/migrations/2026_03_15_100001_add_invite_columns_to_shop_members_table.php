<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_members', function (Blueprint $table) {
            $table->string('invite_token', 64)->nullable()->unique()->after('status');
            $table->timestampTz('invite_expires_at')->nullable()->after('invite_token');
            $table->foreignUuid('invited_by')->nullable()->constrained('users')->after('invite_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('shop_members', function (Blueprint $table) {
            $table->dropForeign(['invited_by']);
            $table->dropColumn(['invite_token', 'invite_expires_at', 'invited_by']);
        });
    }
};
