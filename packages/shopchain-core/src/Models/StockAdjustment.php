<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\AdjustmentStatus;
use ShopChain\Core\Enums\AdjustmentType;
use ShopChain\Core\Traits\BelongsToShop;

class StockAdjustment extends BaseModel
{
    use BelongsToShop;

    protected $table = 'stock_adjustments';

    protected $fillable = [
        'shop_id',
        'product_id',
        'batch_id',
        'warehouse_id',
        'branch_id',
        'type',
        'quantity_change',
        'adjustment_date',
        'reason',
        'notes',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => AdjustmentType::class,
            'quantity_change' => 'integer',
            'adjustment_date' => 'date',
            'status' => AdjustmentStatus::class,
            'approved_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }
}
