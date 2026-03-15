<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('shopchain:check-low-stock')->hourly();
Schedule::command('shopchain:check-expiring-batches')->daily();
Schedule::command('shopchain:check-plan-limits')->daily();

Schedule::command('shopchain:expire-subscriptions')->daily();
Schedule::command('shopchain:renew-subscriptions')->daily();
Schedule::command('shopchain:handle-grace-period')->daily();
