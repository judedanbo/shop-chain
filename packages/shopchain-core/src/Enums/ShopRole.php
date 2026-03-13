<?php

namespace ShopChain\Core\Enums;

enum ShopRole: string
{
    case Owner = 'owner';
    case GeneralManager = 'general_manager';
    case Manager = 'manager';
    case BarManager = 'bar_manager';
    case Waiter = 'waiter';
    case KitchenStaff = 'kitchen_staff';
    case InventoryManager = 'inventory_manager';
    case InventoryOfficer = 'inventory_officer';
    case Salesperson = 'salesperson';
    case Cashier = 'cashier';
    case Accountant = 'accountant';
    case Viewer = 'viewer';
}
