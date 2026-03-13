<?php

namespace ShopChain\Core\Enums;

enum AdjustmentStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
