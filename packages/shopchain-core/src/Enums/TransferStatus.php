<?php

namespace ShopChain\Core\Enums;

enum TransferStatus: string
{
    case Pending = 'pending';
    case InTransit = 'in_transit';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
