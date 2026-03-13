<?php

namespace ShopChain\Core\Enums;

enum BillingStatus: string
{
    case Paid = 'paid';
    case Failed = 'failed';
    case Refunded = 'refunded';
    case Pending = 'pending';
}
