<?php

namespace ShopChain\Core\Enums;

enum ProductStatus: string
{
    case InStock = 'in_stock';
    case LowStock = 'low_stock';
    case OutOfStock = 'out_of_stock';
}
