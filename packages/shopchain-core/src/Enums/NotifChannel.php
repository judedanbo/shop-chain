<?php

namespace ShopChain\Core\Enums;

enum NotifChannel: string
{
    case InApp = 'in_app';
    case Push = 'push';
    case Email = 'email';
    case Sms = 'sms';
}
