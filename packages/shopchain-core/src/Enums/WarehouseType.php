<?php

namespace ShopChain\Core\Enums;

enum WarehouseType: string
{
    case MainStorage = 'main_storage';
    case Secondary = 'secondary';
    case Retail = 'retail';
}
