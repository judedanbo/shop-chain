<?php

namespace ShopChain\Core\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;
use ShopChain\Core\Events\TeamMemberJoined;
use ShopChain\Core\Services\NotificationService;

class SendTeamMemberJoinedNotification implements ShouldQueue
{
    public function __construct(private NotificationService $notificationService) {}

    public function handle(TeamMemberJoined $event): void
    {
        $this->notificationService->dispatch([
            'shop_id' => $event->shop->id,
            'title' => 'New Team Member',
            'message' => "{$event->user->name} has joined the team",
            'category' => NotifCategory::TeamUpdate,
            'priority' => NotifPriority::Low,
            'channels' => [NotifChannel::InApp],
            'target_roles' => ['owner', 'manager'],
        ]);
    }
}
