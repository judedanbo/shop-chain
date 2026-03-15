<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\LowStockDetected;
use ShopChain\Core\Services\NotificationService;

class SendLowStockNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(LowStockDetected $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Low Stock Alert',
            'message' => "{$event->product->name} is running low ({$event->currentQuantity} remaining, threshold: {$event->threshold})",
            'category' => NotifCategory::StockAlert,
            'priority' => NotifPriority::High,
            'channels' => [NotifChannel::InApp, NotifChannel::Push, NotifChannel::Email],
            'target_roles' => ['owner', 'manager', 'inventory_manager', 'inventory_officer'],
        ]);
    }
}
