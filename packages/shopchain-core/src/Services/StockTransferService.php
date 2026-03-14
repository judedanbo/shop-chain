<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\TransferStatus;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\StockTransfer;

class StockTransferService
{
    /**
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function createTransfer(Shop $shop, array $data, User $user): StockTransfer
    {
        $sourceLocation = ProductLocation::where('product_id', $data['product_id'])
            ->where('warehouse_id', $data['from_warehouse_id'] ?? null)
            ->where('branch_id', $data['from_branch_id'] ?? null)
            ->first();

        if (! $sourceLocation || $sourceLocation->quantity < $data['quantity']) {
            throw ValidationException::withMessages([
                'quantity' => ['Insufficient stock at the source location.'],
            ]);
        }

        return StockTransfer::create([
            ...$data,
            'shop_id' => $shop->id,
            'status' => TransferStatus::Pending,
            'created_by' => $user->id,
        ]);
    }

    /**
     * @throws ValidationException
     */
    public function shipTransfer(StockTransfer $transfer): StockTransfer
    {
        if ($transfer->status !== TransferStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Only pending transfers can be shipped.'],
            ]);
        }

        $transfer->update([
            'status' => TransferStatus::InTransit,
            'shipped_at' => now(),
        ]);

        return $transfer->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function completeTransfer(StockTransfer $transfer): StockTransfer
    {
        if ($transfer->status !== TransferStatus::InTransit) {
            throw ValidationException::withMessages([
                'status' => ['Only in-transit transfers can be completed.'],
            ]);
        }

        return DB::transaction(function () use ($transfer) {
            // Decrement source
            $sourceLocation = ProductLocation::where('product_id', $transfer->product_id)
                ->where('warehouse_id', $transfer->from_warehouse_id)
                ->where('branch_id', $transfer->from_branch_id)
                ->first();

            if ($sourceLocation) {
                $sourceLocation->decrement('quantity', $transfer->quantity);
            }

            // Increment/create destination
            $destLocation = ProductLocation::firstOrCreate(
                [
                    'product_id' => $transfer->product_id,
                    'warehouse_id' => $transfer->to_warehouse_id,
                    'branch_id' => $transfer->to_branch_id,
                ],
                ['quantity' => 0],
            );

            $destLocation->increment('quantity', $transfer->quantity);

            $transfer->update([
                'status' => TransferStatus::Completed,
                'received_at' => now(),
            ]);

            return $transfer->fresh();
        });
    }

    /**
     * @throws ValidationException
     */
    public function cancelTransfer(StockTransfer $transfer): StockTransfer
    {
        if ($transfer->status === TransferStatus::Completed) {
            throw ValidationException::withMessages([
                'status' => ['Completed transfers cannot be cancelled.'],
            ]);
        }

        $transfer->update([
            'status' => TransferStatus::Cancelled,
        ]);

        return $transfer->fresh();
    }
}
