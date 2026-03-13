<?php

namespace ShopChain\Core\Enums;

enum AnnouncementTarget: string
{
    case All = 'all';
    case Free = 'free';
    case Basic = 'basic';
    case Max = 'max';
}
