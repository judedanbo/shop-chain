<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use ShopChain\Core\Enums\NotifAction;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Events\NotificationCreated;
use ShopChain\Core\Models\Notification;
use ShopChain\Core\Models\NotificationPreference;
use ShopChain\Core\Models\ShopMember;

class NotificationService
{
    /**
     * Dispatch notifications to target users based on roles and/or individual targeting.
     *
     * @param  array<string, mixed>  $data
     */
    public function dispatch(array $data): Collection
    {
        $shopId = $data['shop_id'];
        $targetRoles = $data['target_roles'] ?? [];
        $targetUserId = $data['target_user_id'] ?? null;

        // Resolve target user IDs from roles
        $userIds = collect();

        if (! empty($targetRoles)) {
            $userIds = ShopMember::withoutGlobalScopes()
                ->where('shop_id', $shopId)
                ->whereIn('role', $targetRoles)
                ->where('status', 'active')
                ->pluck('user_id')
                ->unique();
        }

        // Merge individual target
        if ($targetUserId) {
            $userIds = $userIds->push($targetUserId)->unique();
        }

        $category = $data['category'] instanceof NotifCategory
            ? $data['category']
            : NotifCategory::from($data['category']);

        $channels = $data['channels'] ?? [NotifChannel::InApp];

        $notifications = collect();

        foreach ($userIds as $userId) {
            $preferences = $this->getPreferences(User::find($userId));

            // Check if category is enabled in user preferences
            if (! $this->isCategoryEnabled($preferences, $category)) {
                continue;
            }

            // Filter channels based on quiet hours
            $effectiveChannels = $this->filterChannelsByQuietHours($preferences, $channels);

            $notification = Notification::create([
                'shop_id' => $shopId,
                'user_id' => $userId,
                'title' => $data['title'],
                'message' => $data['message'],
                'category' => $category,
                'priority' => $data['priority'] ?? \ShopChain\Core\Enums\NotifPriority::Medium,
                'channels' => $effectiveChannels,
                'action_url' => $data['action_url'] ?? null,
                'action_data' => $data['action_data'] ?? null,
                'actor_id' => $data['actor_id'] ?? null,
                'actor_role' => $data['actor_role'] ?? null,
                'requires_action' => $data['requires_action'] ?? false,
            ]);

            event(new NotificationCreated($notification));

            $notifications->push($notification);
        }

        return $notifications;
    }

    /**
     * Dispatch a notification to a single user.
     *
     * @param  array<string, mixed>  $data
     */
    public function dispatchToUser(string $userId, array $data): Notification
    {
        $data['target_user_id'] = $userId;
        $data['target_roles'] = [];

        $notifications = $this->dispatch($data);

        return $notifications->first();
    }

    public function markAsRead(Notification $notification): Notification
    {
        $notification->update(['is_read' => true]);

        return $notification;
    }

    public function markAllRead(User $user, ?string $shopId = null): int
    {
        $query = Notification::where('user_id', $user->id)
            ->where('is_read', false);

        if ($shopId) {
            $query->where('shop_id', $shopId);
        }

        return $query->update(['is_read' => true]);
    }

    public function delete(Notification $notification): void
    {
        $notification->delete();
    }

    public function takeAction(Notification $notification, NotifAction $action, User $user): Notification
    {
        $notification->update(['action_taken' => $action]);

        return $notification;
    }

    public function getPreferences(User $user): NotificationPreference
    {
        return NotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            [
                'categories' => $this->defaultCategoryPreferences(),
                'quiet_hours_enabled' => false,
                'quiet_hours_start' => '22:00',
                'quiet_hours_end' => '07:00',
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updatePreferences(User $user, array $data): NotificationPreference
    {
        $preferences = $this->getPreferences($user);
        $preferences->update($data);

        return $preferences->fresh();
    }

    /**
     * @return array<string, array<string, bool>>
     */
    private function defaultCategoryPreferences(): array
    {
        return config('shopchain.notifications.category_defaults', [
            'stock_alert' => ['enabled' => true, 'channels' => ['in_app', 'push', 'email']],
            'order_update' => ['enabled' => true, 'channels' => ['in_app']],
            'sale_event' => ['enabled' => true, 'channels' => ['in_app']],
            'approval_request' => ['enabled' => true, 'channels' => ['in_app', 'push']],
            'team_update' => ['enabled' => true, 'channels' => ['in_app']],
            'system' => ['enabled' => true, 'channels' => ['in_app', 'email']],
            'customer' => ['enabled' => true, 'channels' => ['in_app']],
        ]);
    }

    private function isCategoryEnabled(NotificationPreference $preferences, NotifCategory $category): bool
    {
        $categories = $preferences->categories ?? [];
        $categoryKey = $category->value;

        if (empty($categories) || ! isset($categories[$categoryKey])) {
            return true; // Default to enabled
        }

        return $categories[$categoryKey]['enabled'] ?? true;
    }

    /**
     * @param  array<NotifChannel>  $channels
     * @return array<NotifChannel>
     */
    private function filterChannelsByQuietHours(NotificationPreference $preferences, array $channels): array
    {
        if (! $preferences->quiet_hours_enabled) {
            return $channels;
        }

        $now = now()->format('H:i');
        $start = $preferences->quiet_hours_start ?? '22:00';
        $end = $preferences->quiet_hours_end ?? '07:00';

        $inQuietHours = false;
        if ($start > $end) {
            // Overnight: e.g., 22:00 – 07:00
            $inQuietHours = $now >= $start || $now < $end;
        } else {
            $inQuietHours = $now >= $start && $now < $end;
        }

        if (! $inQuietHours) {
            return $channels;
        }

        // During quiet hours, only keep in_app
        return array_values(array_filter($channels, fn ($ch) => $ch === NotifChannel::InApp || (is_string($ch) && $ch === 'in_app')));
    }
}
