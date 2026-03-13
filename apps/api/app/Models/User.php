<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laragear\TwoFactor\TwoFactorAuthentication;
use Laravel\Passport\HasApiTokens;
use ShopChain\Core\Enums\UserStatus;
use ShopChain\Core\Traits\HasShopRelationships;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, HasUuids, Notifiable, TwoFactorAuthentication, HasShopRelationships;

    /**
     * The guard used by Spatie Permission for this model.
     */
    protected string $guard_name = 'api';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar_url',
        'status',
        'last_active_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => UserStatus::class,
            'last_active_at' => 'datetime',
        ];
    }

    /**
     * Validate credentials for Passport password grant.
     * Rejects non-active users at token issuance time.
     */
    public function validateForPassportPasswordGrant(string $password): bool
    {
        return $this->status === UserStatus::Active
            && Hash::check($password, $this->getAuthPassword());
    }
}
