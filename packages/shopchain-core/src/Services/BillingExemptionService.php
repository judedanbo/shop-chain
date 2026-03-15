<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use ShopChain\Core\Enums\ExemptionUnit;
use ShopChain\Core\Models\BillingExemption;
use ShopChain\Core\Models\Shop;

class BillingExemptionService
{
    public function getActiveExemptions(Shop $shop): Collection
    {
        return BillingExemption::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('starts_at', '<=', now())
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->get();
    }

    public function hasActiveExemption(Shop $shop): bool
    {
        return BillingExemption::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('starts_at', '<=', now())
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    public function grant(Shop $shop, User $admin, array $data): BillingExemption
    {
        $startsAt = $data['starts_at'] ?? now();
        $expiresAt = null;

        if (empty($data['unlimited'])) {
            $period = $data['period'];
            $unit = $data['unit'] instanceof ExemptionUnit ? $data['unit'] : ExemptionUnit::from($data['unit']);

            $expiresAt = match ($unit) {
                ExemptionUnit::Months => $startsAt->copy()->addMonths($period),
                ExemptionUnit::Years => $startsAt->copy()->addYears($period),
            };
        }

        return BillingExemption::create([
            'shop_id' => $shop->id,
            'granted_by' => $admin->id,
            'period' => $data['period'] ?? 0,
            'unit' => $data['unit'] ?? ExemptionUnit::Months,
            'unlimited' => $data['unlimited'] ?? false,
            'reason' => $data['reason'],
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
        ]);
    }

    public function revoke(BillingExemption $exemption): void
    {
        $exemption->update(['expires_at' => now()]);
    }
}
