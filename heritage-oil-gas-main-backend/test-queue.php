#!/usr/bin/env php
<?php

// Test queue-based expiry system

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\FeaturedProduct, App\Jobs\ExpireFeaturedProductJob;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

echo "=== Queue-Based Expiry Test ===\n\n";

// Check if queue worker is running
echo "1. Checking pending jobs in queue...\n";
$jobCount = DB::table('jobs')->count();
echo "   Pending jobs: $jobCount\n\n";

// Find active featured product
$featured = FeaturedProduct::where('is_active', true)->first();

if ($featured) {
    echo "2. Found active featured product: ID {$featured->id}\n";
    echo "   Current is_active: " . ($featured->is_active ? 'true' : 'false') . "\n";
    echo "   finish_time: {$featured->finish_time}\n\n";

    // Dispatch test job to run in 5 seconds
    echo "3. Dispatching test job with 5-second delay...\n";
    $delayTime = now()->addSeconds(5);
    ExpireFeaturedProductJob::dispatch($featured->id)->delay($delayTime);
    echo "   Job dispatched to execute at: {$delayTime}\n\n";

    // Check jobs table
    sleep(1);
    $jobCount = DB::table('jobs')->count();
    echo "4. Jobs in queue now: $jobCount\n\n";

    echo "5. Waiting for job to execute (5 seconds)...\n";
    sleep(6);

    // Check if job was processed
    $featured->refresh();
    echo "6. Featured product is_active after 6 seconds: " . ($featured->is_active ? 'true (FAILED)' : 'false (SUCCESS)') . "\n\n";

    if (!$featured->is_active) {
        echo "✅ QUEUE-BASED EXPIRY IS WORKING!\n";
    } else {
        echo "❌ Queue worker may not be running. Check with: php artisan queue:work\n";
    }
} else {
    echo "❌ No active featured products found to test.\n";
    echo "   Create a featured product first via the API.\n";
}

echo "\nTest complete.\n";
?>