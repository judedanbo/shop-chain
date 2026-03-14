<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\PoStatus;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\PurchaseOrder;
use ShopChain\Core\Models\Shop;

class PurchaseOrderService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createPO(Shop $shop, array $data, User $user): PurchaseOrder
    {
        return DB::transaction(function () use ($shop, $data, $user) {
            $po = PurchaseOrder::create([
                'shop_id' => $shop->id,
                'supplier_id' => $data['supplier_id'],
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'payment_terms' => $data['payment_terms'] ?? null,
                'notes' => $data['notes'] ?? null,
                'expected_date' => $data['expected_date'] ?? null,
                'status' => PoStatus::Draft,
                'created_by' => $user->id,
            ]);

            foreach ($data['items'] as $item) {
                $po->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity_ordered'],
                    'unit_cost' => $item['unit_cost'],
                    'unit_id' => $item['unit_id'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                ]);
            }

            return $po->fresh()->load('items');
        });
    }

    /**
     * @throws ValidationException
     */
    public function submitPO(PurchaseOrder $po): PurchaseOrder
    {
        if ($po->status !== PoStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => ['Only draft purchase orders can be submitted.'],
            ]);
        }

        $po->update(['status' => PoStatus::Pending]);

        return $po->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function approvePO(PurchaseOrder $po, User $user): PurchaseOrder
    {
        if ($po->status !== PoStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Only pending purchase orders can be approved.'],
            ]);
        }

        $po->update([
            'status' => PoStatus::Approved,
            'approved_by' => $user->id,
        ]);

        return $po->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function markShipped(PurchaseOrder $po): PurchaseOrder
    {
        if ($po->status !== PoStatus::Approved) {
            throw ValidationException::withMessages([
                'status' => ['Only approved purchase orders can be marked as shipped.'],
            ]);
        }

        $po->update(['status' => PoStatus::Shipped]);

        return $po->fresh();
    }

    /**
     * @param  array<int, array<string, mixed>>  $receivedItems
     *
     * @throws ValidationException
     */
    public function receivePO(PurchaseOrder $po, array $receivedItems): PurchaseOrder
    {
        if (! in_array($po->status, [PoStatus::Shipped, PoStatus::Partial])) {
            throw ValidationException::withMessages([
                'status' => ['Only shipped or partially received purchase orders can be received.'],
            ]);
        }

        return DB::transaction(function () use ($po, $receivedItems) {
            $po->load('items');

            foreach ($receivedItems as $receivedItem) {
                $poItem = $po->items->firstWhere('id', $receivedItem['po_item_id']);

                if (! $poItem) {
                    continue;
                }

                $remaining = $poItem->quantity_ordered - $poItem->quantity_received;
                $qty = min($receivedItem['quantity_received'], $remaining);

                if ($qty <= 0) {
                    continue;
                }

                $poItem->update([
                    'quantity_received' => $poItem->quantity_received + $qty,
                ]);

                // Update ProductLocation if warehouse is set
                if ($po->warehouse_id) {
                    $location = ProductLocation::firstOrCreate(
                        [
                            'product_id' => $poItem->product_id,
                            'warehouse_id' => $po->warehouse_id,
                            'branch_id' => null,
                        ],
                        ['quantity' => 0],
                    );

                    $location->increment('quantity', $qty);
                }

                // Create Batch for batch-tracked products
                if (! empty($receivedItem['batch_number'])) {
                    $product = Product::find($poItem->product_id);

                    if ($product && $product->batch_tracking) {
                        Batch::create([
                            'product_id' => $poItem->product_id,
                            'shop_id' => $po->shop_id,
                            'batch_number' => $receivedItem['batch_number'],
                            'quantity' => $qty,
                            'initial_quantity' => $qty,
                            'expiry_date' => $poItem->expiry_date,
                            'received_date' => now(),
                            'source_po_id' => $po->id,
                        ]);
                    }
                }
            }

            // Reload items to check totals
            $po->load('items');

            $allReceived = $po->items->every(
                fn ($item) => $item->quantity_received >= $item->quantity_ordered
            );

            if ($allReceived) {
                $po->update([
                    'status' => PoStatus::Received,
                    'received_date' => now(),
                ]);
            } else {
                $po->update(['status' => PoStatus::Partial]);
            }

            return $po->fresh()->load('items');
        });
    }

    /**
     * @throws ValidationException
     */
    public function cancelPO(PurchaseOrder $po): PurchaseOrder
    {
        if (in_array($po->status, [PoStatus::Received, PoStatus::Partial])) {
            throw ValidationException::withMessages([
                'status' => ['Cannot cancel a received or partially received purchase order.'],
            ]);
        }

        $po->update(['status' => PoStatus::Cancelled]);

        return $po->fresh();
    }
}
