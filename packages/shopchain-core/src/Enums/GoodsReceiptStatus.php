<?php

namespace ShopChain\Core\Enums;

enum GoodsReceiptStatus: string
{
    case Draft = 'draft';
    case Completed = 'completed';
}
