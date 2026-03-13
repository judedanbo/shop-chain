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
        Schema::create('audit_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('actor_id')->nullable()->constrained('users');
            $table->text('actor_role')->nullable();
            $table->string('category');
            $table->text('action');
            $table->text('target');
            $table->ipAddress('ip_address')->nullable();
            $table->text('device')->nullable();
            $table->text('session_id')->nullable();
            $table->text('location')->nullable();
            $table->smallInteger('risk_score')->default(0);
            $table->jsonb('before_data')->nullable();
            $table->jsonb('after_data')->nullable();
            $table->text('note')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('shop_id', 'idx_audit_shop');
            $table->index('actor_id', 'idx_audit_actor');
            $table->index('category', 'idx_audit_category');
        });

        DB::statement("ALTER TABLE audit_events ALTER COLUMN category TYPE audit_category USING category::audit_category");
        DB::statement("CREATE INDEX idx_audit_created ON audit_events (created_at DESC)");
        DB::statement("CREATE INDEX idx_audit_risk ON audit_events (risk_score DESC) WHERE risk_score >= 50");

        Schema::create('investigations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('title');
            $table->string('status')->default('open');
            $table->string('priority')->default('medium');
            $table->foreignUuid('assignee_id')->nullable()->constrained('users');
            $table->text('description')->nullable();
            $table->text('impact')->nullable();
            $table->text('findings')->nullable();
            $table->text('resolution')->nullable();
            $table->timestampsTz();

            $table->index('status', 'idx_investigations_status');
            $table->index('assignee_id', 'idx_investigations_assignee');
        });

        DB::statement("ALTER TABLE investigations ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE investigations ALTER COLUMN status TYPE investigation_status USING status::investigation_status");
        DB::statement("ALTER TABLE investigations ALTER COLUMN status SET DEFAULT 'open'::investigation_status");
        DB::statement("ALTER TABLE investigations ALTER COLUMN priority DROP DEFAULT");
        DB::statement("ALTER TABLE investigations ALTER COLUMN priority TYPE risk_level USING priority::risk_level");
        DB::statement("ALTER TABLE investigations ALTER COLUMN priority SET DEFAULT 'medium'::risk_level");

        Schema::create('investigation_events', function (Blueprint $table) {
            $table->foreignUuid('investigation_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('audit_event_id')->constrained()->cascadeOnDelete();
            $table->primary(['investigation_id', 'audit_event_id']);
        });

        Schema::create('investigation_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('investigation_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('author_id')->constrained('users');
            $table->text('content');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('investigation_id', 'idx_inv_notes_investigation');
        });

        Schema::create('anomalies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('rule');
            $table->string('severity');
            $table->text('entity');
            $table->text('summary');
            $table->string('status')->default('reviewing');
            $table->foreignUuid('investigation_id')->nullable()->constrained()->nullOnDelete();
            $table->timestampsTz();

            $table->index('status', 'idx_anomalies_status');
            $table->index('severity', 'idx_anomalies_severity');
        });

        DB::statement("ALTER TABLE anomalies ALTER COLUMN severity TYPE risk_level USING severity::risk_level");
        DB::statement("ALTER TABLE anomalies ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE anomalies ALTER COLUMN status TYPE anomaly_status USING status::anomaly_status");
        DB::statement("ALTER TABLE anomalies ALTER COLUMN status SET DEFAULT 'reviewing'::anomaly_status");
        DB::statement("CREATE INDEX idx_anomalies_investigation ON anomalies (investigation_id) WHERE investigation_id IS NOT NULL");

        Schema::create('anomaly_events', function (Blueprint $table) {
            $table->foreignUuid('anomaly_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('audit_event_id')->constrained()->cascadeOnDelete();
            $table->primary(['anomaly_id', 'audit_event_id']);
        });

        Schema::create('detection_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('name');
            $table->text('description')->nullable();
            $table->text('threshold');
            $table->string('severity')->default('medium');
            $table->boolean('enabled')->default(true);
            $table->integer('triggers')->default(0);
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE detection_rules ALTER COLUMN severity DROP DEFAULT");
        DB::statement("ALTER TABLE detection_rules ALTER COLUMN severity TYPE risk_level USING severity::risk_level");
        DB::statement("ALTER TABLE detection_rules ALTER COLUMN severity SET DEFAULT 'medium'::risk_level");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detection_rules');
        Schema::dropIfExists('anomaly_events');
        Schema::dropIfExists('anomalies');
        Schema::dropIfExists('investigation_notes');
        Schema::dropIfExists('investigation_events');
        Schema::dropIfExists('investigations');
        Schema::dropIfExists('audit_events');
    }
};
