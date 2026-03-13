<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Session extends BaseModel
{
    const UPDATED_AT = null;

    protected $table = 'sessions';

    protected $fillable = [
        'user_id',
        'device',
        'ip_address',
        'location',
        'is_current',
        'last_active',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_current' => 'boolean',
            'last_active' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
