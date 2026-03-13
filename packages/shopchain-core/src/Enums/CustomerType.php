<?php

namespace ShopChain\Core\Enums;

enum CustomerType: string
{
    case Regular = 'regular';
    case Wholesale = 'wholesale';
    case WalkIn = 'walk-in';
}
