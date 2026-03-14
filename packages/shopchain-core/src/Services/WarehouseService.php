<?php

namespace ShopChain\Core\Services;

use Illuminate\Validation\ValidationException;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Warehouse;

class WarehouseService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createWarehouse(Shop $shop, array $data): Warehouse
    {
        return Warehouse::create([
            ...$data,
            'shop_id' => $shop->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateWarehouse(Warehouse $warehouse, array $data): Warehouse
    {
        $warehouse->update($data);

        return $warehouse->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function deleteWarehouse(Warehouse $warehouse): void
    {
        if ($warehouse->productLocations()->where('quantity', '>', 0)->exists()) {
            throw ValidationException::withMessages([
                'warehouse' => ['Cannot delete a warehouse that has stock.'],
            ]);
        }

        $warehouse->delete();
    }
}
