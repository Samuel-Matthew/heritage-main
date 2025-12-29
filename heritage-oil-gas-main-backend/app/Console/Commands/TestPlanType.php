<?php

namespace App\Console\Commands;

use App\Models\Store;
use Illuminate\Console\Command;

class TestPlanType extends Command
{
    protected $signature = 'test:plan-type';
    protected $description = 'Test that plan type is correctly retrieved from subscription';

    public function handle()
    {
        $store = Store::with('subscriptions.plan')->first();

        if (!$store) {
            $this->error('No store found');
            return;
        }

        $this->info('Store: ' . $store->store_name);

        $latestSubscription = $store->subscriptions()->latest()->first();

        if (!$latestSubscription) {
            $this->warn('No subscription found');
            return;
        }

        $this->line('Latest Subscription:');
        $this->line('  Status: ' . $latestSubscription->status);
        $this->line('  Plan Name: ' . $latestSubscription->plan->name);
        $this->line('  Plan Type: ' . $latestSubscription->plan->plan_type);
        $this->line('  Plan Slug: ' . $latestSubscription->plan->slug);

        // Test the actual logic from FeaturedProductController
        $planType = $latestSubscription?->plan?->plan_type ?? 'basic';
        $this->info('Result planType: ' . $planType);
    }
}
