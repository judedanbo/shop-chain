<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    |
    | The default currency code used for monetary calculations.
    | Ghana Cedi (GHS) — stored in pesewas (minor units) to avoid float errors.
    |
    */

    'currency' => env('SHOPCHAIN_CURRENCY', 'GHS'),

    'invite_expiry_days' => env('SHOPCHAIN_INVITE_EXPIRY_DAYS', 7),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    /*
    |--------------------------------------------------------------------------
    | Billing
    |--------------------------------------------------------------------------
    */

    'billing' => [
        'trial_days' => env('SHOPCHAIN_TRIAL_DAYS', 14),
        'grace_period_days' => env('SHOPCHAIN_GRACE_PERIOD_DAYS', 3),
        'default_plan' => 'free',
        'currency' => 'GHS',
    ],

    /*
    |--------------------------------------------------------------------------
    | Ghana Regions
    |--------------------------------------------------------------------------
    |
    | The 16 administrative regions of Ghana, used for shop/branch addresses.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    'notifications' => [
        'category_defaults' => [
            'stock_alert' => ['enabled' => true, 'channels' => ['in_app', 'push', 'email']],
            'order_update' => ['enabled' => true, 'channels' => ['in_app']],
            'sale_event' => ['enabled' => true, 'channels' => ['in_app']],
            'approval_request' => ['enabled' => true, 'channels' => ['in_app', 'push']],
            'team_update' => ['enabled' => true, 'channels' => ['in_app']],
            'system' => ['enabled' => true, 'channels' => ['in_app', 'email']],
            'customer' => ['enabled' => true, 'channels' => ['in_app']],
        ],

        'quiet_hours' => [
            'default_start' => '22:00',
            'default_end' => '07:00',
        ],

        'sms_provider_priority' => ['africastalking', 'twilio'],
    ],

    'regions' => [
        'Ahafo',
        'Ashanti',
        'Bono',
        'Bono East',
        'Central',
        'Eastern',
        'Greater Accra',
        'North East',
        'Northern',
        'Oti',
        'Savannah',
        'Upper East',
        'Upper West',
        'Volta',
        'Western',
        'Western North',
    ],

];
