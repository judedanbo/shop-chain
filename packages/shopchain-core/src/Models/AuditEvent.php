<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\AuditCategory;

class AuditEvent extends BaseModel
{
    const UPDATED_AT = null;

    protected $table = 'audit_events';

    protected $fillable = [
        'shop_id',
        'actor_id',
        'actor_role',
        'category',
        'action',
        'target',
        'ip_address',
        'device',
        'session_id',
        'location',
        'risk_score',
        'before_data',
        'after_data',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'category' => AuditCategory::class,
            'risk_score' => 'integer',
            'before_data' => 'array',
            'after_data' => 'array',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'actor_id');
    }
}
