<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\ReversalResolved;
use ShopChain\Core\Services\NotificationService;

class SendReversalResolvedNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(ReversalResolved $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Reversal '.ucfirst($event->resolution),
            'message' => "Reversal for sale was {$event->resolution} by {$event->resolver->name}",
            'category' => NotifCategory::SaleEvent,
            'priority' => NotifPriority::Medium,
            'channels' => [NotifChannel::InApp],
            'target_roles' => ['owner', 'general_manager'],
            'target_user_id' => $event->sale->reversal_requested_by,
            'actor_id' => $event->resolver->id,
        ]);
    }
}
