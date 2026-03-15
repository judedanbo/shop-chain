<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;

class TeamInviteNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private ShopMember $member,
        private Shop $shop,
        private User $inviter,
    ) {}

    /**
     * @return array<string>
     */
    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $url = config('shopchain.frontend_url').'/invite/'.$this->member->invite_token;
        $days = config('shopchain.invite_expiry_days');

        return (new MailMessage)
            ->subject("You've been invited to join {$this->shop->name}")
            ->line("{$this->inviter->name} invited you to join {$this->shop->name} as {$this->member->role->value}.")
            ->action('Accept Invitation', $url)
            ->line("This invitation expires in {$days} days.")
            ->line('If you did not expect this, ignore this email.');
    }
}
