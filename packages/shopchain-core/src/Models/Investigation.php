<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\InvestigationStatus;
use ShopChain\Core\Enums\RiskLevel;

class Investigation extends BaseModel
{
    protected $table = 'investigations';

    protected $fillable = [
        'title',
        'status',
        'priority',
        'assignee_id',
        'description',
        'impact',
        'findings',
        'resolution',
    ];

    protected function casts(): array
    {
        return [
            'status' => InvestigationStatus::class,
            'priority' => RiskLevel::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'assignee_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(InvestigationNote::class);
    }

    public function auditEvents(): BelongsToMany
    {
        return $this->belongsToMany(AuditEvent::class, 'investigation_events');
    }

    public function anomalies(): HasMany
    {
        return $this->hasMany(Anomaly::class);
    }
}
