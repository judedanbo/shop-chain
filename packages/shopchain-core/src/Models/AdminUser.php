<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;

class AdminUser extends BaseModel
{
    protected $table = 'admin_users';

    protected $fillable = [
        'user_id',
        'role',
        'status',
        'two_fa_enabled',
        'created_by',
        'last_login_at',
    ];

    protected function casts(): array
    {
        return [
            'role' => AdminRole::class,
            'status' => AdminTeamStatus::class,
            'two_fa_enabled' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
