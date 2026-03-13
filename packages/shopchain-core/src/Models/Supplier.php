<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\SupplierStatus;
use ShopChain\Core\Traits\BelongsToShop;

class Supplier extends BaseModel
{
    use BelongsToShop;

    protected $table = 'suppliers';

    protected $fillable = [
        'shop_id',
        'name',
        'contact_name',
        'phone',
        'email',
        'address',
        'rating',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:1',
            'status' => SupplierStatus::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'supplier_products')
            ->withPivot('unit_cost', 'lead_time_days', 'is_preferred')
            ->withTimestamps();
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
