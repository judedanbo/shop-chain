<?php

namespace ShopChain\Core\Models;

class Milestone extends BaseModel
{
    protected $table = 'milestones';

    protected $fillable = [
        'date',
        'title',
        'description',
        'icon',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
