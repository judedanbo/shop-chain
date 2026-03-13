<?php

namespace ShopChain\Core\Enums;

enum BranchType: string
{
    case Retail = 'retail';
    case Warehouse = 'warehouse';
    case Distribution = 'distribution';
}
