<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\KitchenItemStatus;
use ShopChain\Core\Enums\KitchenOrderStatus;
use ShopChain\Core\Models\KitchenOrder;
use ShopChain\Core\Models\KitchenOrderItem;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Shop;

class KitchenOrderService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function placeOrder(Shop $shop, array $data, User $user): KitchenOrder
    {
        return DB::transaction(function () use ($shop, $data, $user) {
            $kitchenItems = [];
            $barItems = [];

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                $entry = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'notes' => $item['notes'] ?? null,
                ];

                if ($product->skip_kitchen) {
                    $barItems[] = $entry;
                } else {
                    $kitchenItems[] = $entry;
                }
            }

            $barOrder = null;
            if (count($barItems) > 0) {
                $barOrder = $this->createOrder($shop, $data, $user, $barItems, barFulfilled: true);
            }

            $kitchenOrder = null;
            if (count($kitchenItems) > 0) {
                $kitchenOrder = $this->createOrder($shop, $data, $user, $kitchenItems, barFulfilled: false);
            }

            // Return the pending kitchen order if it exists, otherwise the bar order
            $primary = $kitchenOrder ?? $barOrder;

            return $primary->load(['items.product', 'server', 'till']);
        });
    }

    public function acceptOrder(KitchenOrder $order): KitchenOrder
    {
        if ($order->status !== KitchenOrderStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Only pending orders can be accepted.'],
            ]);
        }

        $order->update([
            'status' => KitchenOrderStatus::Accepted,
            'accepted_at' => now(),
        ]);

        return $order;
    }

    public function rejectOrder(KitchenOrder $order, string $reason): KitchenOrder
    {
        if ($order->status !== KitchenOrderStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Only pending orders can be rejected.'],
            ]);
        }

        $order->update([
            'status' => KitchenOrderStatus::Rejected,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return $order;
    }

    public function completeOrder(KitchenOrder $order): KitchenOrder
    {
        if ($order->status !== KitchenOrderStatus::Accepted) {
            throw ValidationException::withMessages([
                'status' => ['Only accepted orders can be completed.'],
            ]);
        }

        $order->update([
            'status' => KitchenOrderStatus::Completed,
            'completed_at' => now(),
        ]);

        return $order;
    }

    public function serveOrder(KitchenOrder $order): KitchenOrder
    {
        if ($order->status !== KitchenOrderStatus::Completed) {
            throw ValidationException::withMessages([
                'status' => ['Only completed orders can be served.'],
            ]);
        }

        $order->update([
            'status' => KitchenOrderStatus::Served,
            'served_at' => now(),
        ]);

        return $order;
    }

    public function returnOrder(KitchenOrder $order, string $reason): KitchenOrder
    {
        if ($order->status !== KitchenOrderStatus::Served) {
            throw ValidationException::withMessages([
                'status' => ['Only served orders can be returned.'],
            ]);
        }

        $order->update([
            'status' => KitchenOrderStatus::Returned,
            'returned_at' => now(),
            'return_reason' => $reason,
        ]);

        return $order;
    }

    public function cancelOrder(KitchenOrder $order, User $user): KitchenOrder
    {
        if (! in_array($order->status, [KitchenOrderStatus::Pending, KitchenOrderStatus::Accepted])) {
            throw ValidationException::withMessages([
                'status' => ['Only pending or accepted orders can be cancelled.'],
            ]);
        }

        $order->update([
            'status' => KitchenOrderStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => $user->id,
        ]);

        return $order;
    }

    public function serveItem(KitchenOrderItem $item): KitchenOrderItem
    {
        if ($item->status !== KitchenItemStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['Only pending items can be served.'],
            ]);
        }

        $item->update([
            'status' => KitchenItemStatus::Served,
            'served_at' => now(),
        ]);

        return $item;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function createOrder(Shop $shop, array $data, User $user, array $items, bool $barFulfilled): KitchenOrder
    {
        $total = 0;
        foreach ($items as $entry) {
            $total += $entry['product']->price * $entry['quantity'];
        }
        $total = round($total, 2);

        $order = KitchenOrder::create([
            'shop_id' => $shop->id,
            'branch_id' => $data['branch_id'],
            'till_id' => $data['till_id'],
            'table_number' => $data['table_number'] ?? null,
            'order_type' => $data['order_type'],
            'status' => $barFulfilled ? KitchenOrderStatus::Completed : KitchenOrderStatus::Pending,
            'total' => $total,
            'bar_fulfilled' => $barFulfilled,
            'server_id' => $user->id,
            'completed_at' => $barFulfilled ? now() : null,
        ]);

        foreach ($items as $entry) {
            $order->items()->create([
                'product_id' => $entry['product']->id,
                'quantity' => $entry['quantity'],
                'notes' => $entry['notes'],
                'status' => KitchenItemStatus::Pending,
            ]);
        }

        return $order;
    }
}
