<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\BatchExpiringSoon;
use ShopChain\Core\Services\NotificationService;

class SendBatchExpiryNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(BatchExpiringSoon $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Batch Expiring Soon',
            'message' => "Batch {$event->batch->batch_number} expires in {$event->daysUntilExpiry} days",
            'category' => NotifCategory::StockAlert,
            'priority' => NotifPriority::Medium,
            'channels' => [NotifChannel::InApp],
            'target_roles' => ['owner', 'manager', 'inventory_manager', 'inventory_officer'],
        ]);
    }
}
