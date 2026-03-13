<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class InvestigationEvent extends Pivot
{
    protected $table = 'investigation_events';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'investigation_id',
        'audit_event_id',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function investigation(): BelongsTo
    {
        return $this->belongsTo(Investigation::class);
    }

    public function auditEvent(): BelongsTo
    {
        return $this->belongsTo(AuditEvent::class);
    }
}
