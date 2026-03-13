<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\CustomerType;
use ShopChain\Core\Traits\BelongsToShop;

class Customer extends BaseModel
{
    use BelongsToShop;

    protected $table = 'customers';

    protected $fillable = [
        'shop_id',
        'name',
        'phone',
        'email',
        'type',
        'total_spent',
        'visits',
        'last_visit',
        'loyalty_pts',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'type' => CustomerType::class,
            'total_spent' => 'decimal:2',
            'visits' => 'integer',
            'last_visit' => 'datetime',
            'loyalty_pts' => 'integer',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
