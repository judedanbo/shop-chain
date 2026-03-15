<?php

namespace ShopChain\Core\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use ShopChain\Core\Enums\ShopStatus;
use ShopChain\Core\Models\Shop;

class AdminShopService
{
    public function list(array $filters): LengthAwarePaginator
    {
        $query = Shop::withoutGlobalScopes()
            ->with('owner')
            ->withCount('branches', 'members');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->where('name', 'ilike', "%{$filters['search']}%");
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    public function show(Shop $shop): Shop
    {
        return $shop->load('owner', 'branches', 'members', 'activeSubscription.plan');
    }

    public function suspend(Shop $shop): Shop
    {
        if ($shop->status === ShopStatus::Suspended) {
            throw new \InvalidArgumentException('Shop is already suspended.');
        }

        $shop->update(['status' => ShopStatus::Suspended]);

        return $shop->refresh();
    }

    public function reactivate(Shop $shop): Shop
    {
        if ($shop->status !== ShopStatus::Suspended) {
            throw new \InvalidArgumentException('Shop is not suspended.');
        }

        $shop->update(['status' => ShopStatus::Active]);

        return $shop->refresh();
    }
}
