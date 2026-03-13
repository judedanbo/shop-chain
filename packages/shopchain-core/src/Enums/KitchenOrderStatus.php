<?php

namespace ShopChain\Core\Enums;

enum KitchenOrderStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Completed = 'completed';
    case Served = 'served';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
    case Returned = 'returned';
}
