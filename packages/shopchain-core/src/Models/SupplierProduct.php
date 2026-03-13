<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierProduct extends BaseModel
{
    protected $table = 'supplier_products';

    protected $fillable = [
        'supplier_id',
        'product_id',
        'unit_cost',
        'lead_time_days',
        'is_preferred',
    ];

    protected function casts(): array
    {
        return [
            'unit_cost' => 'decimal:2',
            'lead_time_days' => 'integer',
            'is_preferred' => 'boolean',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
