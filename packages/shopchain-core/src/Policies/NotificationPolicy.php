<?php

namespace ShopChain\Core\Policies;

use App\Models\User;
use ShopChain\Core\Models\Notification;

class NotificationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('notifications.view');
    }

    public function view(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id
            && $user->hasPermissionTo('notifications.view');
    }

    public function update(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id;
    }

    public function delete(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id
            && $user->hasPermissionTo('notifications.manage');
    }

    public function takeAction(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id
            && $notification->requires_action
            && $notification->action_taken === null;
    }
}
