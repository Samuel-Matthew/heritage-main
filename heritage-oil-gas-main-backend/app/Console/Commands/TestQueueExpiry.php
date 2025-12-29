<?php

namespace App\Console\Commands;

use App\Models\FeaturedProduct;
use App\Jobs\ExpireFeaturedProductJob;
use Carbon\Carbon;
use Illuminate\Console\Command;

class TestQueueExpiry extends Command
{
    protected $signature = 'test:queue-expiry {delay_seconds=5}';
    protected $description = 'Test queue-based expiry with configurable delay';

    public function handle()
    {
        $delaySeconds = $this->argument('delay_seconds');

        // Find any active featured product for testing
        $featured = FeaturedProduct::where('is_active', true)->first();

        if (!$featured) {
            $this->error('No active featured products found for testing');
            return;
        }

        $this->info("Testing queue expiry for featured product ID: {$featured->id}");
        $this->info("Current is_active status: " . ($featured->is_active ? 'true' : 'false'));

        // Dispatch job with short delay for testing
        $delayTime = now()->addSeconds($delaySeconds);
        ExpireFeaturedProductJob::dispatch($featured->id)->delay($delayTime);

        $this->info("Job dispatched to run in {$delaySeconds} seconds...");
        $this->info("Expected execution time: {$delayTime->toDateTimeString()}");
        $this->info("\nMake sure queue worker is running: php artisan queue:work");
    }
}
