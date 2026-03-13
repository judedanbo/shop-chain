<?php

namespace ShopChain\Core\Enums;

enum AdjustmentType: string
{
    case Damage = 'damage';
    case Recount = 'recount';
    case Expired = 'expired';
    case Theft = 'theft';
    case Return = 'return';
}
