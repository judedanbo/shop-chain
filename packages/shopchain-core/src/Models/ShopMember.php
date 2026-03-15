<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Traits\BelongsToShop;

class ShopMember extends BaseModel
{
    use BelongsToShop;

    protected $table = 'shop_members';

    protected $fillable = [
        'user_id',
        'shop_id',
        'role',
        'status',
        'invite_token',
        'invite_expires_at',
        'invited_by',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'role' => ShopRole::class,
            'status' => MemberStatus::class,
            'invite_expires_at' => 'datetime',
            'joined_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'invited_by');
    }

    public function branchMembers(): HasMany
    {
        return $this->hasMany(BranchMember::class, 'member_id');
    }

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'branch_members', 'member_id', 'branch_id')
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    public function isInviteExpired(): bool
    {
        return $this->invite_expires_at !== null && $this->invite_expires_at->isPast();
    }
}
