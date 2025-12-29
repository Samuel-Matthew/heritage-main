<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\FeaturedProduct;
use Carbon\Carbon;

class ExpireFeaturedProducts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'featured-products:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire featured products based on plan duration.';

    /**
     * Plan durations in days.
     */
    protected $planDurations = [
        'silver' => 3,
        'gold' => 4,
        'platinum' => 5,
        'basic' => 0,
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $expired = 0;
        $active = FeaturedProduct::where('is_active', true)->get();
        foreach ($active as $featured) {
            $plan = $featured->plan_type ?? 'basic';
            $days = $this->planDurations[$plan] ?? 0;
            // Use finish_time if present, else fallback to old logic
            $expiry = $featured->finish_time ? \Carbon\Carbon::parse($featured->finish_time) : ($featured->featured_at ? $featured->featured_at->copy()->addDays($days) : null);
            if (!$expiry || $days === 0) {
                // Should not be featured, expire immediately
                $featured->is_active = false;
                $featured->rotated_out_at = $now;
                $featured->save();
                $expired++;
                continue;
            }
            if ($now->greaterThanOrEqualTo($expiry)) {
                $featured->is_active = false;
                $featured->rotated_out_at = $now;
                $featured->save();
                $expired++;
            }
        }
        $this->info("Expired $expired featured products.");
    }
}
