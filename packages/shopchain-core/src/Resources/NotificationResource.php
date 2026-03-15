<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Notification
 */
class NotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'title' => $this->title,
            'message' => $this->message,
            'category' => $this->category,
            'priority' => $this->priority,
            'channels' => $this->channels,
            'is_read' => $this->is_read,
            'action_url' => $this->action_url,
            'action_data' => $this->action_data,
            'requires_action' => $this->requires_action,
            'action_taken' => $this->action_taken,
            'actor' => $this->whenLoaded('actor', fn () => [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
