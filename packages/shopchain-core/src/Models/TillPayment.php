<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\TillPayMethod;

class TillPayment extends BaseModel
{
    public $timestamps = false;

    protected $table = 'till_payments';

    protected $fillable = [
        'till_id',
        'order_id',
        'amount',
        'method',
        'paid_at',
        'amount_tendered',
        'change_given',
        'card_type',
        'card_trans_no',
        'momo_provider',
        'momo_phone',
        'momo_trans_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'method' => TillPayMethod::class,
            'paid_at' => 'datetime',
            'amount_tendered' => 'decimal:2',
            'change_given' => 'decimal:2',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function till(): BelongsTo
    {
        return $this->belongsTo(Till::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(KitchenOrder::class, 'order_id');
    }
}
