<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\DiscountType;
use ShopChain\Core\Enums\SaleSource;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Traits\BelongsToShop;

class Sale extends BaseModel
{
    use BelongsToShop;

    protected $table = 'sales';

    protected $fillable = [
        'shop_id',
        'branch_id',
        'till_id',
        'cashier_id',
        'customer_id',
        'subtotal',
        'tax',
        'discount',
        'discount_input',
        'discount_type',
        'total',
        'status',
        'source',
        'verify_token',
        'reversed_at',
        'reversed_by',
        'reversal_reason',
        'reversal_requested_by',
        'reversal_requested_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'discount' => 'decimal:2',
            'discount_input' => 'decimal:2',
            'discount_type' => DiscountType::class,
            'total' => 'decimal:2',
            'status' => SaleStatus::class,
            'source' => SaleSource::class,
            'reversed_at' => 'datetime',
            'reversal_requested_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function till(): BelongsTo
    {
        return $this->belongsTo(Till::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'cashier_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function reversedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'reversed_by');
    }

    public function reversalRequestedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'reversal_requested_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }
}
