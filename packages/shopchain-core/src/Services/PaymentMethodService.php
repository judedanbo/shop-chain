<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use ShopChain\Core\Enums\SubscriptionStatus;
use ShopChain\Core\Models\PaymentMethod;

class PaymentMethodService
{
    public function listForUser(User $user): Collection
    {
        return PaymentMethod::where('user_id', $user->id)->get();
    }

    public function add(User $user, array $data): PaymentMethod
    {
        $hasExisting = PaymentMethod::where('user_id', $user->id)->exists();

        $method = PaymentMethod::create([
            'user_id' => $user->id,
            'type' => $data['type'],
            'provider' => $data['provider'],
            'last4' => $data['last4'] ?? '',
            'display_name' => $data['display_name'] ?? ucfirst($data['provider']) . ' ' . ($data['last4'] ?? ''),
            'expiry' => $data['expiry'] ?? null,
            'is_default' => ! $hasExisting || ($data['is_default'] ?? false),
            'status' => 'active',
            'added_at' => now(),
        ]);

        // If this is set as default, unset others
        if ($method->is_default) {
            PaymentMethod::where('user_id', $user->id)
                ->where('id', '!=', $method->id)
                ->update(['is_default' => false]);
        }

        return $method;
    }

    public function setDefault(PaymentMethod $method, User $user): PaymentMethod
    {
        PaymentMethod::where('user_id', $user->id)
            ->update(['is_default' => false]);

        $method->update(['is_default' => true]);

        return $method->refresh();
    }

    public function remove(PaymentMethod $method, User $user): void
    {
        // Can't remove last method if user has active paid subscriptions
        $otherMethodCount = PaymentMethod::where('user_id', $user->id)
            ->where('id', '!=', $method->id)
            ->count();

        if ($otherMethodCount === 0) {
            $hasActivePaidSub = $user->shops()
                ->whereHas('activeSubscription', function ($query) {
                    $query->where('status', SubscriptionStatus::Active)
                        ->whereHas('plan', fn ($q) => $q->where('price', '>', 0));
                })
                ->exists();

            if ($hasActivePaidSub) {
                throw new \InvalidArgumentException(
                    'Cannot remove last payment method while you have an active paid subscription.'
                );
            }
        }

        $wasDefault = $method->is_default;
        $method->delete();

        // If we deleted the default, promote another
        if ($wasDefault) {
            PaymentMethod::where('user_id', $user->id)
                ->first()
                ?->update(['is_default' => true]);
        }
    }

    public function getDefault(User $user): ?PaymentMethod
    {
        return PaymentMethod::where('user_id', $user->id)
            ->where('is_default', true)
            ->first();
    }
}
