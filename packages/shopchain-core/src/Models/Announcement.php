<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\AnnouncementPriority;
use ShopChain\Core\Enums\AnnouncementStatus;
use ShopChain\Core\Enums\AnnouncementTarget;

class Announcement extends BaseModel
{
    protected $table = 'announcements';

    protected $fillable = [
        'title',
        'body',
        'target',
        'priority',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'target' => AnnouncementTarget::class,
            'priority' => AnnouncementPriority::class,
            'status' => AnnouncementStatus::class,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
