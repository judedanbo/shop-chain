<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\AdminExpense
 */
class AdminExpenseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date,
            'category' => $this->category,
            'description' => $this->description,
            'amount' => $this->amount,
            'vendor' => $this->vendor,
            'recurring' => $this->recurring,
            'reference' => $this->reference,
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'attachments' => $this->whenLoaded('attachments', fn () => AdminExpenseAttachmentResource::collection($this->attachments)),
            'created_at' => $this->created_at,
        ];
    }
}
