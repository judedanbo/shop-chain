<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\KitchenItemStatus;

class KitchenOrderItem extends BaseModel
{
    public $timestamps = false;

    protected $table = 'kitchen_order_items';

    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'notes',
        'status',
        'served_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'status' => KitchenItemStatus::class,
            'served_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function order(): BelongsTo
    {
        return $this->belongsTo(KitchenOrder::class, 'order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
