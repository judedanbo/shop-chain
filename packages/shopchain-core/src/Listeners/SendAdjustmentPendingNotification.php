<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\AdjustmentPending;
use ShopChain\Core\Services\NotificationService;

class SendAdjustmentPendingNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(AdjustmentPending $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Stock Adjustment Pending',
            'message' => "New stock adjustment requires approval from {$event->creator->name}",
            'category' => NotifCategory::ApprovalRequest,
            'priority' => NotifPriority::Medium,
            'channels' => [NotifChannel::InApp],
            'target_roles' => ['owner', 'manager', 'inventory_manager'],
            'actor_id' => $event->creator->id,
            'requires_action' => true,
        ]);
    }
}
