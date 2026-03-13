<?php

namespace ShopChain\Core\Enums;

enum NotifPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Critical = 'critical';
}
