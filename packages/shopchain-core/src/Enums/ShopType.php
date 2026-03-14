<?php

namespace ShopChain\Core\Enums;

enum ShopType: string
{
    case Retail = 'retail';
    case Wholesale = 'wholesale';
    case Pharmacy = 'pharmacy';
    case Restaurant = 'restaurant';
}
