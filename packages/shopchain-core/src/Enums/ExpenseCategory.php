<?php

namespace ShopChain\Core\Enums;

enum ExpenseCategory: string
{
    case Infrastructure = 'infrastructure';
    case PaymentFees = 'payment_fees';
    case Sms = 'sms';
    case Staff = 'staff';
    case Marketing = 'marketing';
    case Software = 'software';
    case Office = 'office';
    case Compliance = 'compliance';
}
