<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosHeldOrderItem extends BaseModel
{
    public $timestamps = false;

    protected $table = 'pos_held_order_items';

    protected $fillable = [
        'held_order_id',
        'product_id',
        'quantity',
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
        return $this->belongsTo(PosHeldOrder::class, 'held_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
