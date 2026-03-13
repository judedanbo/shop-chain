<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Casts\PostgresArray;
use ShopChain\Core\Enums\WarehouseStatus;
use ShopChain\Core\Enums\WarehouseType;
use ShopChain\Core\Traits\BelongsToShop;

class Warehouse extends BaseModel
{
    use BelongsToShop;

    protected $table = 'warehouses';

    protected $fillable = [
        'shop_id',
        'name',
        'type',
        'manager_id',
        'address',
        'phone',
        'email',
        'capacity',
        'zones',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'type' => WarehouseType::class,
            'status' => WarehouseStatus::class,
            'capacity' => 'integer',
            'zones' => PostgresArray::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function manager(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'manager_id');
    }

    public function productLocations(): HasMany
    {
        return $this->hasMany(ProductLocation::class);
    }
}
