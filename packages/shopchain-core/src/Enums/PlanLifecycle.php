<?php

namespace ShopChain\Core\Enums;

enum PlanLifecycle: string
{
    case Draft = 'draft';
    case Scheduled = 'scheduled';
    case Active = 'active';
    case Retiring = 'retiring';
    case Retired = 'retired';
}
