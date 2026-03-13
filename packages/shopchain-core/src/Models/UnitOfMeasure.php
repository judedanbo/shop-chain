<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\UnitType;
use ShopChain\Core\Traits\BelongsToShop;

class UnitOfMeasure extends BaseModel
{
    use BelongsToShop;

    protected $table = 'units_of_measure';

    protected $fillable = [
        'shop_id',
        'name',
        'abbreviation',
        'type',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'type' => UnitType::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'unit_id');
    }
}
