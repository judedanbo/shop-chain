<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\PayMethod;

class SalePayment extends BaseModel
{
    const UPDATED_AT = null;

    protected $table = 'sale_payments';

    protected $fillable = [
        'sale_id',
        'method',
        'label',
        'amount',
        'amount_tendered',
        'change_given',
        'card_type',
        'card_trans_no',
        'momo_provider',
        'momo_phone',
        'momo_ref',
    ];

    protected function casts(): array
    {
        return [
            'method' => PayMethod::class,
            'amount' => 'decimal:2',
            'amount_tendered' => 'decimal:2',
            'change_given' => 'decimal:2',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
