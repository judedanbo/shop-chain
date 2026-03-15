<?php

namespace ShopChain\Core\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use ShopChain\Core\Models\KitchenOrder;

class KitchenOrderUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public KitchenOrder $kitchenOrder) {}

    /**
     * @return array<\Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("shop.{$this->kitchenOrder->shop_id}.kitchen.{$this->kitchenOrder->branch_id}"),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->kitchenOrder->id,
            'status' => $this->kitchenOrder->status->value,
            'table_number' => $this->kitchenOrder->table_number,
            'branch_id' => $this->kitchenOrder->branch_id,
        ];
    }
}
