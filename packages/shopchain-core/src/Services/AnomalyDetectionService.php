<?php

namespace ShopChain\Core\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use ShopChain\Core\Enums\AnomalyStatus;
use ShopChain\Core\Models\Anomaly;
use ShopChain\Core\Models\DetectionRule;
use ShopChain\Core\Models\Investigation;

class AnomalyDetectionService
{
    public function listAnomalies(array $filters): LengthAwarePaginator
    {
        $query = Anomaly::with('investigation');

        if (! empty($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    public function updateStatus(Anomaly $anomaly, AnomalyStatus $status): Anomaly
    {
        $anomaly->update(['status' => $status]);

        return $anomaly->refresh();
    }

    public function linkToInvestigation(Anomaly $anomaly, Investigation $investigation): Anomaly
    {
        $anomaly->update([
            'investigation_id' => $investigation->id,
            'status' => AnomalyStatus::Escalated,
        ]);

        return $anomaly->refresh()->load('investigation');
    }

    public function dismiss(Anomaly $anomaly): Anomaly
    {
        return $this->updateStatus($anomaly, AnomalyStatus::Dismissed);
    }

    public function listRules(): Collection
    {
        return DetectionRule::orderBy('name')->get();
    }

    public function createRule(array $data): DetectionRule
    {
        return DetectionRule::create($data);
    }

    public function updateRule(DetectionRule $rule, array $data): DetectionRule
    {
        $rule->update($data);

        return $rule->refresh();
    }

    public function toggleRule(DetectionRule $rule): DetectionRule
    {
        $rule->update(['enabled' => ! $rule->enabled]);

        return $rule->refresh();
    }

    public function deleteRule(DetectionRule $rule): void
    {
        $rule->delete();
    }
}
