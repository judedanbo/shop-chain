<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\ReversalRequested;
use ShopChain\Core\Services\NotificationService;

class SendReversalRequestedNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(ReversalRequested $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Reversal Requested',
            'message' => "{$event->requester->name} requested reversal: {$event->reason}",
            'category' => NotifCategory::ApprovalRequest,
            'priority' => NotifPriority::High,
            'channels' => [NotifChannel::InApp, NotifChannel::Push],
            'target_roles' => ['owner', 'general_manager', 'manager'],
            'actor_id' => $event->requester->id,
            'requires_action' => true,
        ]);
    }
}
