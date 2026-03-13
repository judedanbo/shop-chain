<?php

namespace ShopChain\Core\Enums;

enum UnitType: string
{
    case Weight = 'weight';
    case Volume = 'volume';
    case Count = 'count';
    case Length = 'length';
}
