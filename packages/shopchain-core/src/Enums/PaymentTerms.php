<?php

namespace ShopChain\Core\Enums;

enum PaymentTerms: string
{
    case Cod = 'cod';
    case Net15 = 'net15';
    case Net30 = 'net30';
    case Net60 = 'net60';
}
