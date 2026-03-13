<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductLocation extends BaseModel
{
    protected $table = 'product_locations';

    const CREATED_AT = null;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'branch_id',
        'quantity',
        'last_counted_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'last_counted_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
