<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\PayType;

class PaymentMethod extends BaseModel
{
    protected $table = 'payment_methods';

    protected $fillable = [
        'user_id',
        'type',
        'provider',
        'last4',
        'display_name',
        'is_default',
        'expiry',
        'status',
        'added_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => PayType::class,
            'is_default' => 'boolean',
            'added_at' => 'datetime',
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
