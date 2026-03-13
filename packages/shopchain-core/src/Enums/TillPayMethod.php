<?php

namespace ShopChain\Core\Enums;

enum TillPayMethod: string
{
    case Cash = 'cash';
    case Card = 'card';
    case Momo = 'momo';
}
