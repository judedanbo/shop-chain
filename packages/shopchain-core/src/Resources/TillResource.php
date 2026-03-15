<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Till
 */
class TillResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'branch_id' => $this->branch_id,
            'name' => $this->name,
            'is_active' => $this->is_active,
            'opening_float' => $this->opening_float,
            'closing_balance' => $this->closing_balance,
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
            'opened_by' => $this->whenLoaded('openedBy', fn () => [
                'id' => $this->openedBy->id,
                'name' => $this->openedBy->name,
            ]),
            'closed_by' => $this->whenLoaded('closedBy', fn () => [
                'id' => $this->closedBy->id,
                'name' => $this->closedBy->name,
            ]),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'summary' => $this->when(isset($this->additional['summary']), fn () => $this->additional['summary']),
            'sales_count' => $this->whenCounted('sales'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
