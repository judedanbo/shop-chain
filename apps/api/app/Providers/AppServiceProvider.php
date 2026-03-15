<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;
use Laravel\Pennant\Feature;
use ShopChain\Core\Models\Shop;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configurePassport();
        $this->configureRateLimiting();
        $this->configurePennant();
    }

    /**
     * Configure Passport token scopes and lifetimes.
     */
    private function configurePassport(): void
    {
        Passport::tokensCan([
            'pos' => 'Access POS features',
            'receipts' => 'Generate and view receipts',
            'reports' => 'Access reports and analytics',
            'barcode' => 'Generate and scan barcodes',
            'purchase-orders' => 'Manage purchase orders',
            'stock-transfers' => 'Manage stock transfers',
            'low-stock-alerts' => 'Receive low stock alerts',
            'two-fa' => 'Manage two-factor authentication',
            'api-access' => 'Full API access (Max plan)',
            'data-export' => 'Export data',
            'custom-branding' => 'Custom branding features',
            'audit-trail' => 'Access audit trail',
            'general-manager' => 'General manager features',
            'support' => 'Access support features',
        ]);

        Passport::tokensExpireIn(now()->addHours(24));
        Passport::refreshTokensExpireIn(now()->addDays(30));
        Passport::personalAccessTokensExpireIn(now()->addMonths(6));
        Passport::enablePasswordGrant();
    }

    /**
     * Configure rate limiters for auth endpoints.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('receipt-verify', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        RateLimiter::for('invite', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });
    }

    /**
     * Define Pennant feature flags resolved from shop's active subscription.
     *
     * The 14 plan-gated feature keys. Each resolves against the shop's
     * active plan to determine if the feature is available.
     */
    private const FEATURE_KEY_MAP = [
        'pos' => 'pos',
        'receipts' => 'receipts',
        'reports' => 'reports',
        'barcode' => 'barcode',
        'purchase-orders' => 'purchaseOrders',
        'stock-transfers' => 'stockTransfers',
        'low-stock-alerts' => 'lowStockAlerts',
        'two-fa' => 'twoFA',
        'api-access' => 'apiAccess',
        'data-export' => 'dataExport',
        'custom-branding' => 'customBranding',
        'audit-trail' => 'auditTrail',
        'general-manager' => 'generalManager',
    ];

    private function configurePennant(): void
    {
        $booleanFeatures = [
            'pos',
            'receipts',
            'reports',
            'barcode',
            'purchase-orders',
            'stock-transfers',
            'low-stock-alerts',
            'two-fa',
            'api-access',
            'data-export',
            'custom-branding',
            'audit-trail',
            'general-manager',
        ];

        foreach ($booleanFeatures as $feature) {
            Feature::define($feature, function (mixed $scope) use ($feature) {
                if (! $scope instanceof Shop) {
                    return false;
                }
                $planKey = self::FEATURE_KEY_MAP[$feature];
                $value = $scope->activePlan->features[$planKey] ?? false;

                return (bool) $value;
            });
        }

        Feature::define('support', function (mixed $scope) {
            if (! $scope instanceof Shop) {
                return false;
            }
            $value = $scope->activePlan->features['support'] ?? false;

            return $value === 'community' ? false : $value;
        });
    }
}
