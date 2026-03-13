<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;
use Laravel\Pennant\Feature;

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
    }

    /**
     * Define Pennant feature flags resolved from shop's active subscription.
     *
     * The 14 plan-gated feature keys. Each resolves against the shop's
     * active plan to determine if the feature is available.
     */
    private function configurePennant(): void
    {
        // Features are defined as closures that receive the scope (Shop model).
        // Implementation will resolve from shop's active subscription plan.
        // Placeholder definitions — will be wired to Plan model in Phase 1.3/8.

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
            Feature::define($feature, function (mixed $scope) {
                // Will be resolved from $scope->activePlan->features once models exist
                return false;
            });
        }

        // Support has rich values: 'email', 'priority', or false
        Feature::define('support', function (mixed $scope) {
            return false;
        });
    }
}
