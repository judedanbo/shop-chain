<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\ExemptionUnit;
use ShopChain\Core\Traits\BelongsToShop;

class BillingExemption extends BaseModel
{
    use BelongsToShop;

    protected $table = 'billing_exemptions';

    protected $fillable = [
        'shop_id',
        'granted_by',
        'period',
        'unit',
        'unlimited',
        'reason',
        'starts_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'period' => 'integer',
            'unit' => ExemptionUnit::class,
            'unlimited' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'granted_by');
    }
}
