<?php

namespace ShopChain\Core\Enums;

enum BatchCondition: string
{
    case Good = 'good';
    case Damaged = 'damaged';
    case ShortShip = 'short_ship';
}
