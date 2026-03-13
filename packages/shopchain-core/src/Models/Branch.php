<?php

namespace ShopChain\Core\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShopChain\Core\Enums\BranchStatus;
use ShopChain\Core\Enums\BranchType;
use ShopChain\Core\Traits\BelongsToShop;

class Branch extends BaseModel
{
    use BelongsToShop;

    protected $table = 'branches';

    protected $fillable = [
        'shop_id',
        'name',
        'type',
        'manager_id',
        'is_default',
        'address',
        'phone',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'type' => BranchType::class,
            'status' => BranchStatus::class,
            'is_default' => 'boolean',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function manager(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'manager_id');
    }

    public function branchMembers(): HasMany
    {
        return $this->hasMany(BranchMember::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(ShopMember::class, 'branch_members', 'branch_id', 'member_id')
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    public function productLocations(): HasMany
    {
        return $this->hasMany(ProductLocation::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
