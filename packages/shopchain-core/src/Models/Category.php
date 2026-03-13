<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\CategoryStatus;
use ShopChain\Core\Traits\BelongsToShop;

class Category extends BaseModel
{
    use BelongsToShop;

    protected $table = 'categories';

    protected $fillable = [
        'shop_id',
        'name',
        'icon',
        'color',
        'description',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'status' => CategoryStatus::class,
            'sort_order' => 'integer',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
