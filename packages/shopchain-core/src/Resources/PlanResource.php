<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Plan
 */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => $this->price,
            'icon' => $this->icon,
            'color' => $this->color,
            'badge' => $this->badge,
            'limits' => $this->limits,
            'features' => $this->features,
            'lifecycle' => $this->lifecycle,
            'available_from' => $this->available_from,
            'retire_at' => $this->retire_at,
            'grandfathered' => $this->grandfathered,
            'subscribers_count' => $this->whenCounted('subscriptions'),
        ];
    }
}
