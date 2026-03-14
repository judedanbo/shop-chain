<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\GoodsReceiptStatus;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\GoodsReceipt;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Shop;

class GoodsReceiptService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createReceipt(Shop $shop, array $data, User $user): GoodsReceipt
    {
        return DB::transaction(function () use ($shop, $data, $user) {
            $receipt = GoodsReceipt::create([
                'shop_id' => $shop->id,
                'reference' => $this->generateReference($shop),
                'warehouse_id' => $data['warehouse_id'],
                'receipt_date' => $data['receipt_date'] ?? now(),
                'notes' => $data['notes'] ?? null,
                'status' => GoodsReceiptStatus::Draft,
                'created_by' => $user->id,
            ]);

            foreach ($data['items'] as $item) {
                $receipt->items()->create($item);
            }

            return $receipt->fresh()->load('items');
        });
    }

    /**
     * @throws ValidationException
     */
    public function completeReceipt(GoodsReceipt $receipt): GoodsReceipt
    {
        if ($receipt->status !== GoodsReceiptStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => ['Only draft receipts can be completed.'],
            ]);
        }

        return DB::transaction(function () use ($receipt) {
            $receipt->load('items');

            foreach ($receipt->items as $item) {
                // Create batch if product has batch tracking and batch_number provided
                if ($item->batch_number) {
                    $product = Product::find($item->product_id);

                    if ($product && $product->batch_tracking) {
                        Batch::create([
                            'product_id' => $item->product_id,
                            'shop_id' => $receipt->shop_id,
                            'batch_number' => $item->batch_number,
                            'quantity' => $item->quantity,
                            'initial_quantity' => $item->quantity,
                            'expiry_date' => $item->expiry_date,
                            'received_date' => $receipt->receipt_date,
                        ]);
                    }
                }

                // Update/create product location
                $location = ProductLocation::firstOrCreate(
                    [
                        'product_id' => $item->product_id,
                        'warehouse_id' => $receipt->warehouse_id,
                        'branch_id' => null,
                    ],
                    ['quantity' => 0],
                );

                $location->increment('quantity', $item->quantity);
            }

            $receipt->update(['status' => GoodsReceiptStatus::Completed]);

            return $receipt->fresh()->load('items');
        });
    }

    public function generateReference(Shop $shop): string
    {
        $today = now()->format('Ymd');
        $prefix = "GR-{$today}-";

        $lastReference = GoodsReceipt::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('reference', 'like', $prefix.'%')
            ->orderByDesc('reference')
            ->value('reference');

        if ($lastReference) {
            $lastNumber = (int) substr($lastReference, strlen($prefix));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix.str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
