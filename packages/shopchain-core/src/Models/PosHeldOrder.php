<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\DiscountType;
use ShopChain\Core\Traits\BelongsToShop;

class PosHeldOrder extends BaseModel
{
    use BelongsToShop;

    public $timestamps = false;

    protected $table = 'pos_held_orders';

    protected $fillable = [
        'shop_id',
        'branch_id',
        'held_by',
        'discount_value',
        'discount_type',
        'held_at',
    ];

    protected function casts(): array
    {
        return [
            'discount_type' => DiscountType::class,
            'held_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function heldBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'held_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PosHeldOrderItem::class, 'held_order_id');
    }
}
