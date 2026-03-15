<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\ReversalDirect;
use ShopChain\Core\Services\NotificationService;

class SendReversalDirectNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(ReversalDirect $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Sale Reversed',
            'message' => "Sale was reversed by {$event->reverser->name}: {$event->reason}",
            'category' => NotifCategory::SaleEvent,
            'priority' => NotifPriority::High,
            'channels' => [NotifChannel::InApp, NotifChannel::Push],
            'target_roles' => ['owner', 'general_manager', 'manager'],
            'actor_id' => $event->reverser->id,
        ]);
    }
}
