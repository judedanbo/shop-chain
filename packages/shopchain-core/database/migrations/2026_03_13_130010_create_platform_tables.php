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
        Schema::create('admin_expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('date');
            $table->string('category');
            $table->text('description');
            $table->decimal('amount', 12, 2);
            $table->text('vendor');
            $table->boolean('recurring')->default(false);
            $table->text('reference')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestampsTz();

            $table->index('category', 'idx_admin_expenses_category');
        });

        DB::statement("ALTER TABLE admin_expenses ALTER COLUMN category TYPE expense_category USING category::expense_category");
        DB::statement("CREATE INDEX idx_admin_expenses_date ON admin_expenses (date DESC)");

        Schema::create('admin_expense_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('expense_id')->constrained('admin_expenses')->cascadeOnDelete();
            $table->text('name');
            $table->text('type');
            $table->text('size');
            $table->text('url');
            $table->timestampTz('added_at')->useCurrent();

            $table->index('expense_id', 'idx_expense_attachments_expense');
        });

        Schema::create('milestones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('date');
            $table->text('title');
            $table->text('description')->nullable();
            $table->text('icon')->nullable();
            $table->timestampsTz();
        });

        DB::statement("CREATE INDEX idx_milestones_date ON milestones (date DESC)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('milestones');
        Schema::dropIfExists('admin_expense_attachments');
        Schema::dropIfExists('admin_expenses');
    }
};
