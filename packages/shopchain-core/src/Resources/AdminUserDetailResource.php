<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\User
 */
class AdminUserDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'status' => $this->status,
            'last_active_at' => $this->last_active_at,
            'owned_shops' => $this->whenLoaded('ownedShops', fn () => $this->ownedShops->map(fn ($shop) => [
                'id' => $shop->id,
                'name' => $shop->name,
                'status' => $shop->status,
            ])),
            'admin_user' => $this->whenLoaded('adminUser', fn () => [
                'id' => $this->adminUser->id,
                'role' => $this->adminUser->role,
                'status' => $this->adminUser->status,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
