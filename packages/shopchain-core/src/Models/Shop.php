<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\ShopStatus;

class Shop extends BaseModel
{
    protected $table = 'shops';

    protected $fillable = [
        'name',
        'type',
        'currency',
        'timezone',
        'tax_rate',
        'tax_label',
        'receipt_footer',
        'low_stock_threshold',
        'logo_url',
        'phone',
        'email',
        'address',
        'region',
        'status',
        'owner_id',
    ];

    protected function casts(): array
    {
        return [
            'tax_rate' => 'decimal:2',
            'status' => ShopStatus::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function owner(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'owner_id');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ShopMember::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function tills(): HasMany
    {
        return $this->hasMany(Till::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
