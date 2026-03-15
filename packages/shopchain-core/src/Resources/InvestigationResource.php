<?php

namespace ShopChain\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \ShopChain\Core\Models\Investigation
 */
class InvestigationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status,
            'priority' => $this->priority,
            'description' => $this->description,
            'impact' => $this->impact,
            'findings' => $this->findings,
            'resolution' => $this->resolution,
            'assignee' => $this->whenLoaded('assignee', fn () => [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ]),
            'notes' => InvestigationNoteResource::collection($this->whenLoaded('notes')),
            'audit_events' => AuditEventResource::collection($this->whenLoaded('auditEvents')),
            'anomalies' => AnomalyResource::collection($this->whenLoaded('anomalies')),
            'notes_count' => $this->whenCounted('notes'),
            'audit_events_count' => $this->whenCounted('auditEvents'),
            'anomalies_count' => $this->whenCounted('anomalies'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
