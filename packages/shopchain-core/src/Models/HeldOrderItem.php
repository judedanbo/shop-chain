<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeldOrderItem extends BaseModel
{
    public $timestamps = false;

    protected $table = 'held_order_items';

    protected $fillable = [
        'held_order_id',
        'product_id',
        'quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function heldOrder(): BelongsTo
    {
        return $this->belongsTo(HeldOrder::class, 'held_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
