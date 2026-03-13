<?php

namespace ShopChain\Core\Enums;

enum InvestigationStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Escalated = 'escalated';
    case Closed = 'closed';
}
