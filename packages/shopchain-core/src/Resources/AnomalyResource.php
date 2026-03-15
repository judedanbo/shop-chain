<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Anomaly
 */
class AnomalyResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rule' => $this->rule,
            'severity' => $this->severity,
            'entity' => $this->entity,
            'summary' => $this->summary,
            'status' => $this->status,
            'investigation' => $this->whenLoaded('investigation', fn () => [
                'id' => $this->investigation->id,
                'title' => $this->investigation->title,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
