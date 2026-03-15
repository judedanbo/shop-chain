<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tills', function (Blueprint $table) {
            $table->decimal('opening_float', 12, 2)->default(0)->after('is_active');
            $table->decimal('closing_balance', 12, 2)->nullable()->after('opening_float');
            $table->foreignUuid('closed_by')->nullable()->constrained('users')->after('closing_balance');
        });
    }

    public function down(): void
    {
        Schema::table('tills', function (Blueprint $table) {
            $table->dropForeign(['closed_by']);
            $table->dropColumn(['opening_float', 'closing_balance', 'closed_by']);
        });
    }
};
