<?php

namespace ShopChain\Core\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class PostgresArray implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null) {
            return null;
        }

        if ($value === '{}') {
            return [];
        }

        $inner = substr($value, 1, -1);

        return str_getcsv($inner, ',', '"', '');
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value) && count($value) === 0) {
            return '{}';
        }

        $escaped = array_map(function ($item) {
            if (str_contains((string) $item, ',') || str_contains((string) $item, '"') || str_contains((string) $item, ' ')) {
                return '"' . str_replace('"', '\\"', (string) $item) . '"';
            }

            return (string) $item;
        }, (array) $value);

        return '{' . implode(',', $escaped) . '}';
    }
}
