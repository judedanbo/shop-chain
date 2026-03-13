<?php

namespace ShopChain\Core\Enums;

enum BatchStatus: string
{
    case Active = 'active';
    case Expired = 'expired';
    case Depleted = 'depleted';
}
