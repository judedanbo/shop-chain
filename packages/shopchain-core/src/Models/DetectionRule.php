<?php

namespace ShopChain\Core\Models;

use ShopChain\Core\Enums\RiskLevel;

class DetectionRule extends BaseModel
{
    protected $table = 'detection_rules';

    protected $fillable = [
        'name',
        'description',
        'threshold',
        'severity',
        'enabled',
        'triggers',
    ];

    protected function casts(): array
    {
        return [
            'severity' => RiskLevel::class,
            'enabled' => 'boolean',
            'triggers' => 'integer',
        ];
    }
}
