<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\PlanLifecycle;

class Plan extends Model
{
    use HasFactory;

    protected $table = 'plans';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'price',
        'icon',
        'color',
        'badge',
        'limits',
        'features',
        'lifecycle',
        'available_from',
        'retire_at',
        'migrate_at',
        'fallback_id',
        'grandfathered',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'limits' => 'array',
            'features' => 'array',
            'lifecycle' => PlanLifecycle::class,
            'available_from' => 'datetime',
            'retire_at' => 'datetime',
            'migrate_at' => 'datetime',
            'grandfathered' => 'boolean',
        ];
    }

    protected static function newFactory()
    {
        $factory = 'ShopChain\\Core\\Database\\Factories\\PlanFactory';

        return class_exists($factory) ? $factory::new() : null;
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function fallback(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'fallback_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
