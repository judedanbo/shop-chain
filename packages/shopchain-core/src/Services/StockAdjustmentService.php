<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\AdjustmentStatus;
use ShopChain\Core\Events\AdjustmentPending;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\StockAdjustment;

class StockAdjustmentService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createAdjustment(Shop $shop, array $data, User $user): StockAdjustment
    {
        $adjustment = StockAdjustment::create([
            ...$data,
            'shop_id' => $shop->id,
            'status' => AdjustmentStatus::Pending,
            'created_by' => $user->id,
        ]);

        event(new AdjustmentPending($shop, $adjustment, $user));

        return $adjustment;
    }

    /**
     * @throws ValidationException
     */
    public function approveAdjustment(StockAdjustment $adjustment, User $user): StockAdjustment
    {
        if ($adjustment->status !== AdjustmentStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Only pending adjustments can be approved.'],
            ]);
        }

        return DB::transaction(function () use ($adjustment, $user) {
            $adjustment->update([
                'status' => AdjustmentStatus::Approved,
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            $location = ProductLocation::firstOrCreate(
                [
                    'product_id' => $adjustment->product_id,
                    'warehouse_id' => $adjustment->warehouse_id,
                    'branch_id' => $adjustment->branch_id,
                ],
                ['quantity' => 0],
            );

            $location->increment('quantity', $adjustment->quantity_change);

            return $adjustment->fresh();
        });
    }

    /**
     * @throws ValidationException
     */
    public function rejectAdjustment(StockAdjustment $adjustment, User $user, ?string $reason = null): StockAdjustment
    {
        if ($adjustment->status !== AdjustmentStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Only pending adjustments can be rejected.'],
            ]);
        }

        $notes = $adjustment->notes;
        if ($reason) {
            $notes = $notes ? $notes."\nRejection reason: ".$reason : 'Rejection reason: '.$reason;
        }

        $adjustment->update([
            'status' => AdjustmentStatus::Rejected,
            'approved_by' => $user->id,
            'approved_at' => now(),
            'notes' => $notes,
        ]);

        return $adjustment->fresh();
    }
}
