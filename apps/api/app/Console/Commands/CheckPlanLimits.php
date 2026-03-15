<?php

namespace App\Console\Commands;

use App\Services\PlanEnforcementService;
use Illuminate\Console\Command;
use ShopChain\Core\Events\PlanLimitWarning;
use ShopChain\Core\Models\Shop;

class CheckPlanLimits extends Command
{
    protected $signature = 'shopchain:check-plan-limits';

    protected $description = 'Check plan usage for all shops and warn when nearing limits';

    public function handle(PlanEnforcementService $planService): int
    {
        Shop::query()->each(function (Shop $shop) use ($planService) {
            $usage = $planService->computeUsage($shop);

            foreach ($usage as $item) {
                if ($item['unlimited'] || $item['max'] <= 0) {
                    continue;
                }

                if ($item['pct'] >= 80) {
                    event(new PlanLimitWarning($shop, $item['key'], (float) $item['pct']));
                }
            }
        });

        $this->info('Plan limit check completed.');

        return self::SUCCESS;
    }
}
