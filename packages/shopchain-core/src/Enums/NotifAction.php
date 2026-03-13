<?php

namespace ShopChain\Core\Enums;

enum NotifAction: string
{
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Acknowledged = 'acknowledged';
}
