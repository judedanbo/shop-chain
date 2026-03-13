<?php

namespace ShopChain\Core\Enums;

enum AdminRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case BillingManager = 'billing_manager';
    case SupportAgent = 'support_agent';
    case Auditor = 'auditor';
}
