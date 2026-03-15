<?php

namespace ShopChain\Core\Services;

use Illuminate\Support\Facades\Cache;

class PlatformSettingsService
{
    private const CACHE_KEY = 'platform_settings';

    private const DEFAULTS = [
        'maintenance_mode' => false,
        'open_registrations' => true,
        'free_trial' => true,
        'force_2fa' => false,
        'trial_days' => 14,
    ];

    public function all(): array
    {
        $overrides = Cache::get(self::CACHE_KEY, []);

        return array_merge(self::DEFAULTS, $overrides);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $settings = $this->all();

        return $settings[$key] ?? $default;
    }

    public function update(array $settings): array
    {
        $validKeys = array_keys(self::DEFAULTS);
        $filtered = array_intersect_key($settings, array_flip($validKeys));

        $current = Cache::get(self::CACHE_KEY, []);
        $merged = array_merge($current, $filtered);

        Cache::forever(self::CACHE_KEY, $merged);

        return array_merge(self::DEFAULTS, $merged);
    }

    public function reset(): array
    {
        Cache::forget(self::CACHE_KEY);

        return self::DEFAULTS;
    }
}
