<?php

namespace App\Console;

use App\Console\Commands\ExpireSubscriptions;
use App\Console\Commands\ExpireFeaturedProducts;
use App\Console\Commands\ExpireHotDeals;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        ExpireSubscriptions::class,
        ExpireFeaturedProducts::class,
        ExpireHotDeals::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Run subscription expiration check every minute (for testing)
        $schedule->command('subscriptions:expire')->everyMinute();
        // Run featured product expiration every minute (for testing)
        $schedule->command('featured-products:expire')->everyMinute();
        // Run hot deal expiration every minute (for testing)
        $schedule->command('hot-deals:expire')->everyMinute();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
