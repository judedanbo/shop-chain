<?php

namespace ShopChain\Core\Enums;

enum SaleStatus: string
{
    case Completed = 'completed';
    case Reversed = 'reversed';
    case PendingReversal = 'pending_reversal';
}
