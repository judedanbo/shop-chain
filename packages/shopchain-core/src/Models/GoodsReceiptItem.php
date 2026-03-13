<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\BatchCondition;

class GoodsReceiptItem extends BaseModel
{
    protected $table = 'goods_receipt_items';

    public $timestamps = false;

    protected $fillable = [
        'receipt_id',
        'product_id',
        'quantity',
        'batch_number',
        'condition',
        'notes',
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'expiry_date' => 'date',
            'condition' => BatchCondition::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class, 'receipt_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
