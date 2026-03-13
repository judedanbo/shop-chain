<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\BillingStatus;
use ShopChain\Core\Traits\BelongsToShop;

class BillingRecord extends BaseModel
{
    use BelongsToShop;

    protected $table = 'billing_records';

    protected $fillable = [
        'shop_id',
        'subscription_id',
        'amount',
        'method_id',
        'status',
        'tx_ref',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'status' => BillingStatus::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'method_id');
    }
}
