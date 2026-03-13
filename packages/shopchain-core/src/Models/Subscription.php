<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Traits\BelongsToShop;

class Subscription extends BaseModel
{
    use BelongsToShop;

    protected $table = 'subscriptions';

    protected $fillable = [
        'shop_id',
        'plan_id',
        'status',
        'started_at',
        'expires_at',
        'cancelled_at',
        'auto_renew',
    ];

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'auto_renew' => 'boolean',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function billingRecords(): HasMany
    {
        return $this->hasMany(BillingRecord::class);
    }
}
