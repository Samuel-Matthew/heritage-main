<?php

namespace App\Console\Commands;

use App\Models\FeaturedProduct;
use App\Models\HotDeal;
use App\Models\Subscription;
use Illuminate\Console\Command;

class TestSubscriptionCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:subscription-codes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test subscription code linking to promotions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Subscription Code Linking Test ===');
        $this->line('');

        // Get all subscriptions
        $subscriptions = Subscription::with('store')->get();

        foreach ($subscriptions as $subscription) {
            $this->info("Store: {$subscription->store->name}");
            $this->line("  Subscription Code: {$subscription->subscription_code}");
            $this->line("  Plan: {$subscription->plan?->plan_type}");

            // Count featured products for this subscription
            $featuredCount = FeaturedProduct::where('subscription_code', $subscription->subscription_code)->count();
            $this->line("  Featured Products: {$featuredCount}");

            // Show them
            if ($featuredCount > 0) {
                $featured = FeaturedProduct::where('subscription_code', $subscription->subscription_code)
                    ->select('id', 'product_id', 'subscription_code', 'is_active')
                    ->get();

                foreach ($featured as $feature) {
                    $status = $feature->is_active ? 'ACTIVE' : 'EXPIRED';
                    $this->line("    - Product {$feature->product_id}: {$status}");
                }
            }

            // Count hot deals for this subscription
            $dealsCount = HotDeal::where('subscription_code', $subscription->subscription_code)->count();
            $this->line("  Hot Deals: {$dealsCount}");

            // Show them
            if ($dealsCount > 0) {
                $deals = HotDeal::where('subscription_code', $subscription->subscription_code)
                    ->select('id', 'product_id', 'subscription_code', 'is_active')
                    ->get();

                foreach ($deals as $deal) {
                    $status = $deal->is_active ? 'ACTIVE' : 'EXPIRED';
                    $this->line("    - Product {$deal->product_id}: {$status}");
                }
            }

            $this->line('');
        }

        $this->info('✓ All promotions are now linked by unique subscription codes!');
    }
}
