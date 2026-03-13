<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\ProductStatus;
use ShopChain\Core\Traits\BelongsToShop;

class Product extends BaseModel
{
    use BelongsToShop;

    protected $table = 'products';

    protected $fillable = [
        'shop_id',
        'sku',
        'name',
        'description',
        'barcode',
        'category_id',
        'unit_id',
        'price',
        'cost',
        'reorder_level',
        'image_url',
        'expiry_date',
        'batch_tracking',
        'skip_kitchen',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost' => 'decimal:2',
            'reorder_level' => 'integer',
            'expiry_date' => 'date',
            'batch_tracking' => 'boolean',
            'skip_kitchen' => 'boolean',
            'status' => ProductStatus::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(UnitOfMeasure::class, 'unit_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    public function productLocations(): HasMany
    {
        return $this->hasMany(ProductLocation::class);
    }

    public function priceHistory(): HasMany
    {
        return $this->hasMany(PriceHistory::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class, 'supplier_products')
            ->withPivot('unit_cost', 'lead_time_days', 'is_preferred')
            ->withTimestamps();
    }
}
