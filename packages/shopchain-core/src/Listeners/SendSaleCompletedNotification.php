<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\SaleCompleted;
use ShopChain\Core\Services\NotificationService;

class SendSaleCompletedNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(SaleCompleted $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Sale Completed',
            'message' => "Sale of {$event->sale->total} completed by {$event->cashier->name}",
            'category' => NotifCategory::SaleEvent,
            'priority' => NotifPriority::Low,
            'channels' => [NotifChannel::InApp],
            'target_roles' => ['owner', 'manager'],
            'actor_id' => $event->cashier->id,
        ]);
    }
}
