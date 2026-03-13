<?php

namespace ShopChain\Core\Enums;

enum PoStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Approved = 'approved';
    case Shipped = 'shipped';
    case Partial = 'partial';
    case Received = 'received';
    case Cancelled = 'cancelled';
}
