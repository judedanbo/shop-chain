<?php

namespace ShopChain\Core\Enums;

enum AnomalyStatus: string
{
    case Escalated = 'escalated';
    case Reviewing = 'reviewing';
    case Resolved = 'resolved';
    case Dismissed = 'dismissed';
}
