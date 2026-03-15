<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\NotificationPreference
 */
class NotificationPreferenceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'categories' => $this->categories,
            'quiet_hours_enabled' => $this->quiet_hours_enabled,
            'quiet_hours_start' => $this->quiet_hours_start,
            'quiet_hours_end' => $this->quiet_hours_end,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
