<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Casts\PostgresEnumArray;
use ShopChain\Core\Enums\NotifAction;
use ShopChain\Core\Enums\NotifCategory;
use ShopChain\Core\Enums\NotifChannel;
use ShopChain\Core\Enums\NotifPriority;

class Notification extends BaseModel
{
    const UPDATED_AT = null;

    protected $table = 'notifications';

    protected $fillable = [
        'shop_id',
        'user_id',
        'title',
        'message',
        'category',
        'priority',
        'channels',
        'is_read',
        'action_url',
        'action_data',
        'actor_id',
        'actor_role',
        'requires_action',
        'action_taken',
    ];

    protected function casts(): array
    {
        return [
            'category' => NotifCategory::class,
            'priority' => NotifPriority::class,
            'channels' => PostgresEnumArray::class.':'.NotifChannel::class,
            'is_read' => 'boolean',
            'action_data' => 'array',
            'requires_action' => 'boolean',
            'action_taken' => NotifAction::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'actor_id');
    }
}
