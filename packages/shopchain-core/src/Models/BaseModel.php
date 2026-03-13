<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

abstract class BaseModel extends Model
{
    use HasUuids, HasFactory;

    protected static function newFactory()
    {
        $modelName = class_basename(static::class);
        $factory = "ShopChain\\Core\\Database\\Factories\\{$modelName}Factory";

        return class_exists($factory) ? $factory::new() : null;
    }
}
