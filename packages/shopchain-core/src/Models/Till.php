<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\DiscountType;
use ShopChain\Core\Traits\BelongsToShop;

class Till extends BaseModel
{
    use BelongsToShop;

    protected $table = 'tills';

    protected $fillable = [
        'shop_id',
        'branch_id',
        'name',
        'opened_by',
        'opened_at',
        'closed_at',
        'is_active',
        'discount',
        'discount_input',
        'discount_type',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'is_active' => 'boolean',
            'discount' => 'decimal:2',
            'discount_input' => 'decimal:2',
            'discount_type' => DiscountType::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'opened_by');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function kitchenOrders(): HasMany
    {
        return $this->hasMany(KitchenOrder::class);
    }
}
