<?php

namespace ShopChain\Core\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class PostgresEnumArray implements CastsAttributes
{
    protected PostgresArray $arraycast;

    public function __construct(protected string $enumClass)
    {
        $this->arraycast = new PostgresArray();
    }

    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        $array = $this->arraycast->get($model, $key, $value, $attributes);

        if ($array === null) {
            return null;
        }

        return array_map(fn (string $v) => $this->enumClass::from($v), $array);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $strings = array_map(function ($item) {
            return $item instanceof \BackedEnum ? $item->value : (string) $item;
        }, (array) $value);

        return $this->arraycast->set($model, $key, $strings, $attributes);
    }
}
