<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\DiscountApplied;
use ShopChain\Core\Services\NotificationService;

class SendDiscountAppliedNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(DiscountApplied $event): void
    {
        $isHighDiscount = $event->percent >= 15;

        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Discount Applied',
            'message' => "{$event->percent}% discount applied by {$event->cashier->name} on sale",
            'category' => NotifCategory::SaleEvent,
            'priority' => $isHighDiscount ? NotifPriority::High : NotifPriority::Medium,
            'channels' => $isHighDiscount
                ? [NotifChannel::InApp, NotifChannel::Push]
                : [NotifChannel::InApp],
            'target_roles' => ['owner', 'general_manager', 'manager'],
            'actor_id' => $event->cashier->id,
        ]);
    }
}
