<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\DetectionRule
 */
class DetectionRuleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'threshold' => $this->threshold,
            'severity' => $this->severity,
            'enabled' => $this->enabled,
            'triggers' => $this->triggers,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
