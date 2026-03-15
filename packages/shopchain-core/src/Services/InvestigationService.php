<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use ShopChain\Core\Enums\InvestigationStatus;
use ShopChain\Core\Models\AuditEvent;
use ShopChain\Core\Models\Investigation;
use ShopChain\Core\Models\InvestigationNote;

class InvestigationService
{
    public function list(array $filters): LengthAwarePaginator
    {
        $query = Investigation::with('assignee')
            ->withCount('notes', 'auditEvents', 'anomalies');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (! empty($filters['assignee_id'])) {
            $query->where('assignee_id', $filters['assignee_id']);
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): Investigation
    {
        $data['status'] = $data['status'] ?? InvestigationStatus::Open;

        return Investigation::create($data);
    }

    public function show(Investigation $investigation): Investigation
    {
        return $investigation->load('notes.author', 'auditEvents', 'anomalies', 'assignee');
    }

    public function update(Investigation $investigation, array $data): Investigation
    {
        $investigation->update($data);

        return $investigation->refresh();
    }

    public function transitionStatus(Investigation $investigation, InvestigationStatus $newStatus): Investigation
    {
        $allowed = [
            InvestigationStatus::Open->value => [InvestigationStatus::InProgress, InvestigationStatus::Closed],
            InvestigationStatus::InProgress->value => [InvestigationStatus::Escalated, InvestigationStatus::Closed],
            InvestigationStatus::Escalated->value => [InvestigationStatus::InProgress, InvestigationStatus::Closed],
        ];

        $transitions = $allowed[$investigation->status->value] ?? [];

        if (! in_array($newStatus, $transitions)) {
            throw new \InvalidArgumentException(
                "Cannot transition from {$investigation->status->value} to {$newStatus->value}."
            );
        }

        $investigation->update(['status' => $newStatus]);

        return $investigation->refresh();
    }

    public function addNote(Investigation $investigation, User $author, string $content): InvestigationNote
    {
        return $investigation->notes()->create([
            'author_id' => $author->id,
            'content' => $content,
        ]);
    }

    public function linkAuditEvent(Investigation $investigation, AuditEvent $event): void
    {
        $investigation->auditEvents()->syncWithoutDetaching([$event->id]);
    }

    public function unlinkAuditEvent(Investigation $investigation, AuditEvent $event): void
    {
        $investigation->auditEvents()->detach($event->id);
    }
}
