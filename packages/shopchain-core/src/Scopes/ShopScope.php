<?php

namespace ShopChain\Core\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ShopScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $shopId = app()->bound('current_shop_id') ? app('current_shop_id') : null;

        if ($shopId !== null) {
            $builder->where($model->qualifyColumn('shop_id'), $shopId);
        }
    }
}
