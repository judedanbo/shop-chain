<?php

namespace ShopChain\Core\Enums;

enum MemberStatus: string
{
    case Active = 'active';
    case Invited = 'invited';
    case Suspended = 'suspended';
    case Removed = 'removed';
}
