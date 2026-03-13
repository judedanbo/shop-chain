<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Traits\BelongsToShop;

class PriceHistory extends BaseModel
{
    use BelongsToShop;

    protected $table = 'price_history';

    const UPDATED_AT = null;

    protected $fillable = [
        'product_id',
        'shop_id',
        'old_price',
        'new_price',
        'old_cost',
        'new_cost',
        'reason',
        'changed_by',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'old_price' => 'decimal:2',
            'new_price' => 'decimal:2',
            'old_cost' => 'decimal:2',
            'new_cost' => 'decimal:2',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'changed_by');
    }
}
