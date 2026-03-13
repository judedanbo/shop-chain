<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\BatchStatus;
use ShopChain\Core\Traits\BelongsToShop;

class Batch extends BaseModel
{
    use BelongsToShop;

    protected $table = 'batches';

    protected $fillable = [
        'product_id',
        'shop_id',
        'batch_number',
        'quantity',
        'initial_quantity',
        'expiry_date',
        'received_date',
        'source_po_id',
        'location',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'initial_quantity' => 'integer',
            'expiry_date' => 'date',
            'received_date' => 'date',
            'status' => BatchStatus::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function sourcePo(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'source_po_id');
    }
}
