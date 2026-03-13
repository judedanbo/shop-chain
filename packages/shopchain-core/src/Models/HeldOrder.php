<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\OrderType;
use ShopChain\Core\Traits\BelongsToShop;

class HeldOrder extends BaseModel
{
    use BelongsToShop;

    protected $table = 'held_orders';

    protected $fillable = [
        'shop_id',
        'till_id',
        'table_number',
        'order_type',
        'label',
        'held_at',
    ];

    protected function casts(): array
    {
        return [
            'order_type' => OrderType::class,
            'held_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function till(): BelongsTo
    {
        return $this->belongsTo(Till::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(HeldOrderItem::class);
    }
}
