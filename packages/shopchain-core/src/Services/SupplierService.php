<?php

namespace ShopChain\Core\Services;

use Illuminate\Validation\ValidationException;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\Supplier;
use ShopChain\Core\Models\SupplierProduct;

class SupplierService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createSupplier(Shop $shop, array $data): Supplier
    {
        return Supplier::create([
            ...$data,
            'shop_id' => $shop->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateSupplier(Supplier $supplier, array $data): Supplier
    {
        $supplier->update($data);

        return $supplier->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function deleteSupplier(Supplier $supplier): void
    {
        if ($supplier->purchaseOrders()->exists()) {
            throw ValidationException::withMessages([
                'supplier' => ['Cannot delete a supplier that has purchase orders.'],
            ]);
        }

        $supplier->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function linkProduct(Supplier $supplier, array $data): void
    {
        SupplierProduct::updateOrCreate(
            [
                'supplier_id' => $supplier->id,
                'product_id' => $data['product_id'],
            ],
            [
                'unit_cost' => $data['unit_cost'],
                'lead_time_days' => $data['lead_time_days'] ?? null,
                'is_preferred' => $data['is_preferred'] ?? false,
            ],
        );
    }

    public function unlinkProduct(Supplier $supplier, string $productId): void
    {
        SupplierProduct::where('supplier_id', $supplier->id)
            ->where('product_id', $productId)
            ->delete();
    }
}
