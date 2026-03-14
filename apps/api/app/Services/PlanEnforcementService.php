<?php

namespace App\Services;

use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;
use ShopChain\Core\Models\Supplier;
use ShopChain\Core\Models\Warehouse;

class PlanEnforcementService
{
    private const DECISION_MAKER_ROLES = [
        ShopRole::Owner,
        ShopRole::GeneralManager,
        ShopRole::Manager,
    ];

    public function canAdd(Shop $shop, string $resourceKey, ?ShopMember $member = null): bool
    {
        // Non-decision-makers are never blocked
        if ($member && ! in_array($member->role, self::DECISION_MAKER_ROLES)) {
            return true;
        }

        $limits = $shop->activePlan->limits ?? [];
        $max = $limits[$resourceKey] ?? 0;

        // -1 means unlimited
        if ($max === -1) {
            return true;
        }

        $usage = $this->computeUsage($shop);
        $usageItem = collect($usage)->firstWhere('key', $resourceKey);

        if (! $usageItem) {
            return true;
        }

        return $usageItem['used'] < $max;
    }

    public function computeUsage(Shop $shop): array
    {
        $limits = $shop->activePlan->limits ?? [];

        $counters = [
            'shops' => [
                'label' => 'Shops',
                'used' => Shop::where('owner_id', $shop->owner_id)->count(),
                'max' => $limits['shops'] ?? 0,
            ],
            'branchesPerShop' => [
                'label' => 'Branches',
                'used' => Branch::withoutGlobalScopes()->where('shop_id', $shop->id)->count(),
                'max' => $limits['branchesPerShop'] ?? 0,
            ],
            'teamPerShop' => [
                'label' => 'Team Members',
                'used' => ShopMember::withoutGlobalScopes()
                    ->where('shop_id', $shop->id)
                    ->where('status', MemberStatus::Active)
                    ->count(),
                'max' => $limits['teamPerShop'] ?? 0,
            ],
            'productsPerShop' => [
                'label' => 'Products',
                'used' => Product::withoutGlobalScopes()->where('shop_id', $shop->id)->count(),
                'max' => $limits['productsPerShop'] ?? 0,
            ],
            'monthlyTransactions' => [
                'label' => 'Monthly Transactions',
                'used' => Sale::withoutGlobalScopes()
                    ->where('shop_id', $shop->id)
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'max' => $limits['monthlyTransactions'] ?? 0,
            ],
            'storageMB' => [
                'label' => 'Storage (MB)',
                'used' => 0,
                'max' => $limits['storageMB'] ?? 0,
            ],
            'suppliers' => [
                'label' => 'Suppliers',
                'used' => Supplier::withoutGlobalScopes()->where('shop_id', $shop->id)->count(),
                'max' => $limits['suppliers'] ?? 0,
            ],
            'warehouses' => [
                'label' => 'Warehouses',
                'used' => Warehouse::withoutGlobalScopes()->where('shop_id', $shop->id)->count(),
                'max' => $limits['warehouses'] ?? 0,
            ],
        ];

        return collect($counters)->map(function ($item, $key) {
            $max = $item['max'];
            $used = $item['used'];
            $unlimited = $max === -1;
            $pct = ($max > 0 && ! $unlimited) ? (int) round(($used / $max) * 100) : 0;

            return [
                'key' => $key,
                'label' => $item['label'],
                'used' => $used,
                'max' => $max,
                'unlimited' => $unlimited,
                'pct' => $pct,
                'warning' => $pct >= 80,
                'blocked' => $pct >= 100,
            ];
        })->values()->all();
    }
}
