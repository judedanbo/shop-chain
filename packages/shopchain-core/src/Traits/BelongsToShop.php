<?php

namespace ShopChain\Core\Traits;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Scopes\ShopScope;

trait BelongsToShop
{
    public static function bootBelongsToShop(): void
    {
        static::addGlobalScope(new ShopScope());

        static::creating(function ($model) {
            if (empty($model->shop_id) && app()->bound('current_shop_id')) {
                $model->shop_id = app('current_shop_id');
            }
        });
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}
