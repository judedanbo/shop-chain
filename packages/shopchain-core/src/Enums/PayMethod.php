<?php

namespace ShopChain\Core\Enums;

enum PayMethod: string
{
    case Cash = 'cash';
    case Card = 'card';
    case Momo = 'momo';
    case Split = 'split';
}
