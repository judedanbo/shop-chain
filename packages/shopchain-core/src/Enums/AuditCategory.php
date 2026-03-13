<?php

namespace ShopChain\Core\Enums;

enum AuditCategory: string
{
    case Auth = 'auth';
    case Financial = 'financial';
    case Data = 'data';
    case Admin = 'admin';
    case System = 'system';
}
