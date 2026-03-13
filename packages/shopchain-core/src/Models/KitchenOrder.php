<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\KitchenOrderStatus;
use ShopChain\Core\Enums\OrderType;
use ShopChain\Core\Traits\BelongsToShop;

class KitchenOrder extends BaseModel
{
    use BelongsToShop;

    protected $table = 'kitchen_orders';

    protected $fillable = [
        'shop_id',
        'branch_id',
        'till_id',
        'sale_id',
        'table_number',
        'order_type',
        'status',
        'total',
        'bar_fulfilled',
        'server_id',
        'accepted_at',
        'completed_at',
        'rejected_at',
        'rejection_reason',
        'served_at',
        'returned_at',
        'return_reason',
        'cancelled_at',
        'cancelled_by',
    ];

    protected function casts(): array
    {
        return [
            'order_type' => OrderType::class,
            'status' => KitchenOrderStatus::class,
            'total' => 'decimal:2',
            'bar_fulfilled' => 'boolean',
            'accepted_at' => 'datetime',
            'completed_at' => 'datetime',
            'rejected_at' => 'datetime',
            'served_at' => 'datetime',
            'returned_at' => 'datetime',
            'cancelled_at' => 'datetime',
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

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'server_id');
    }

    public function cancelledByUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'cancelled_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(KitchenOrderItem::class, 'order_id');
    }

    public function tillPayments(): HasMany
    {
        return $this->hasMany(TillPayment::class, 'order_id');
    }
}
