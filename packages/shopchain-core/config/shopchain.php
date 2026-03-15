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
    | Ghana Regions
    |--------------------------------------------------------------------------
    |
    | The 16 administrative regions of Ghana, used for shop/branch addresses.
    |
    */

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
