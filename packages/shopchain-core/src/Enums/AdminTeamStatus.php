<?php

namespace ShopChain\Core\Enums;

enum AdminTeamStatus: string
{
    case Active = 'active';
    case Invited = 'invited';
    case Suspended = 'suspended';
}
