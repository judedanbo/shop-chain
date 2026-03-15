<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\AuditEvent
 */
class AuditEventResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category,
            'action' => $this->action,
            'target' => $this->target,
            'risk_score' => $this->risk_score,
            'ip_address' => $this->ip_address,
            'device' => $this->device,
            'note' => $this->note,
            'before_data' => $this->before_data,
            'after_data' => $this->after_data,
            'actor' => $this->whenLoaded('actor', fn () => [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'email' => $this->actor->email,
            ]),
            'shop' => $this->whenLoaded('shop', fn () => [
                'id' => $this->shop->id,
                'name' => $this->shop->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
