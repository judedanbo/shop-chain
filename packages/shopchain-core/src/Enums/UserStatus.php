<?php

namespace ShopChain\Core\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Deactivated = 'deactivated';
    case Pending = 'pending';
    case Suspended = 'suspended';
}
