<?php

namespace ShopChain\Core\Enums;

enum ShopStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Pending = 'pending';
}
