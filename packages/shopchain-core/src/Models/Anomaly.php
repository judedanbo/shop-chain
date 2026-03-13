<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use ShopChain\Core\Enums\AnomalyStatus;
use ShopChain\Core\Enums\RiskLevel;

class Anomaly extends BaseModel
{
    protected $table = 'anomalies';

    protected $fillable = [
        'rule',
        'severity',
        'entity',
        'summary',
        'status',
        'investigation_id',
    ];

    protected function casts(): array
    {
        return [
            'severity' => RiskLevel::class,
            'status' => AnomalyStatus::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function investigation(): BelongsTo
    {
        return $this->belongsTo(Investigation::class);
    }

    public function auditEvents(): BelongsToMany
    {
        return $this->belongsToMany(AuditEvent::class, 'anomaly_events');
    }
}
