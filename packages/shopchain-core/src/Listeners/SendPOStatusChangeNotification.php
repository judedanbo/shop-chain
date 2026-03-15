<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\PurchaseOrderStatusChanged;
use ShopChain\Core\Services\NotificationService;

class SendPOStatusChangeNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(PurchaseOrderStatusChanged $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => "Purchase Order {$event->newStatus}",
            'message' => "PO updated from {$event->oldStatus} to {$event->newStatus} by {$event->actor->name}",
            'category' => NotifCategory::OrderUpdate,
            'priority' => NotifPriority::Medium,
            'channels' => [NotifChannel::InApp],
            'target_roles' => ['owner', 'manager', 'inventory_manager'],
            'actor_id' => $event->actor->id,
        ]);
    }
}
