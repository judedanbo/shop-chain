<?php

namespace ShopChain\Core\Enums;

enum AnnouncementPriority: string
{
    case Info = 'info';
    case Warning = 'warning';
    case Critical = 'critical';
}
