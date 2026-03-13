<?php

namespace ShopChain\Core\Enums;

enum NotifCategory: string
{
    case StockAlert = 'stock_alert';
    case OrderUpdate = 'order_update';
    case SaleEvent = 'sale_event';
    case ApprovalRequest = 'approval_request';
    case TeamUpdate = 'team_update';
    case System = 'system';
    case Customer = 'customer';
}
