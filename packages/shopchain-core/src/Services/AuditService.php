<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use ShopChain\Core\Models\AuditEvent;
use ShopChain\Core\Models\Shop;

class AuditService
{
    public function listEvents(array $filters): LengthAwarePaginator
    {
        $query = AuditEvent::with('actor', 'shop');

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['risk_min'])) {
            $query->where('risk_score', '>=', (int) $filters['risk_min']);
        }

        if (! empty($filters['risk_max'])) {
            $query->where('risk_score', '<=', (int) $filters['risk_max']);
        }

        if (! empty($filters['from'])) {
            $query->where('created_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->where('created_at', '<=', $filters['to']);
        }

        if (! empty($filters['shop_id'])) {
            $query->where('shop_id', $filters['shop_id']);
        }

        if (! empty($filters['actor_id'])) {
            $query->where('actor_id', $filters['actor_id']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('action', 'ilike', "%{$filters['search']}%")
                    ->orWhere('target', 'ilike', "%{$filters['search']}%")
                    ->orWhere('note', 'ilike', "%{$filters['search']}%");
            });
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    public function showEvent(AuditEvent $event): AuditEvent
    {
        return $event->load('actor', 'shop');
    }

    public function logEvent(array $data): AuditEvent
    {
        return AuditEvent::create($data);
    }

    public function getEventsByShop(Shop $shop, array $filters): LengthAwarePaginator
    {
        $filters['shop_id'] = $shop->id;

        return $this->listEvents($filters);
    }

    public function getEventsByUser(User $user, array $filters): LengthAwarePaginator
    {
        $filters['actor_id'] = $user->id;

        return $this->listEvents($filters);
    }
}
