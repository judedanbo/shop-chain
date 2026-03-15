<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\PlanLimitWarning;
use ShopChain\Core\Services\NotificationService;

class SendPlanLimitWarningNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(PlanLimitWarning $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'Plan Limit Warning',
            'message' => "{$event->resourceKey} usage is at {$event->percentUsed}% of your plan limit",
            'category' => NotifCategory::System,
            'priority' => NotifPriority::High,
            'channels' => [NotifChannel::InApp, NotifChannel::Email],
            'target_roles' => ['owner'],
        ]);
    }
}
