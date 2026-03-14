<?php

namespace ShopChain\Core\Services;

use Illuminate\Validation\ValidationException;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\UnitOfMeasure;

class UnitOfMeasureService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createUnit(Shop $shop, array $data): UnitOfMeasure
    {
        return UnitOfMeasure::create([
            ...$data,
            'shop_id' => $shop->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateUnit(UnitOfMeasure $unit, array $data): UnitOfMeasure
    {
        $unit->update($data);

        return $unit->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function deleteUnit(UnitOfMeasure $unit): void
    {
        if ($unit->products()->exists()) {
            throw ValidationException::withMessages([
                'unit' => ['Cannot delete a unit that has products.'],
            ]);
        }

        $unit->delete();
    }
}
