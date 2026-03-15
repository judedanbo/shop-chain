<?php

namespace ShopChain\Core\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;

class TeamMemberJoined
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Shop $shop,
        public ShopMember $member,
        public User $user,
    ) {}
}
