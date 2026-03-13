<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\PaymentTerms;
use ShopChain\Core\Enums\PoStatus;
use ShopChain\Core\Traits\BelongsToShop;

class PurchaseOrder extends BaseModel
{
    use BelongsToShop;

    protected $table = 'purchase_orders';

    protected $fillable = [
        'shop_id',
        'supplier_id',
        'warehouse_id',
        'status',
        'payment_terms',
        'notes',
        'created_by',
        'approved_by',
        'expected_date',
        'received_date',
    ];

    protected function casts(): array
    {
        return [
            'status' => PoStatus::class,
            'payment_terms' => PaymentTerms::class,
            'expected_date' => 'date',
            'received_date' => 'date',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(POItem::class, 'po_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class, 'source_po_id');
    }
}
