<?php

namespace ShopChain\Core\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use ShopChain\Core\Models\PurchaseOrder;
use ShopChain\Core\Models\Shop;

class PurchaseOrderStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Shop $shop,
        public PurchaseOrder $purchaseOrder,
        public string $oldStatus,
        public string $newStatus,
        public User $actor,
    ) {}
}
