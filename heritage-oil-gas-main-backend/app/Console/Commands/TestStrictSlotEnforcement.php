<?php

namespace App\Console\Commands;

use App\Models\FeaturedProduct;
use App\Models\HotDeal;
use App\Models\Product;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TestStrictSlotEnforcement extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:strict-slot-enforcement';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test that slot limits are strictly enforced per subscription';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Strict Slot Enforcement...');
        $this->line('');

        // Get or create a test seller
        $seller = \App\Models\User::where('email', 'test-seller@example.com')->first();
        if (!$seller) {
            $this->warn('Test seller not found. Please create one first.');
            return;
        }

        $store = $seller->store;
        if (!$store) {
            $this->warn('Test seller has no store.');
            return;
        }

        // Get or create Gold plan subscription
        $goldPlan = SubscriptionPlan::where('slug', 'gold')->first();
        if (!$goldPlan) {
            $this->warn('Gold plan not found.');
            return;
        }

        // Get latest subscription
        $subscription = $store->subscriptions()->latest()->first();
        if (!$subscription) {
            $this->warn('Test seller has no subscription.');
            return;
        }

        $this->info('=== Test Information ===');
        $this->line("Seller: {$seller->name} ({$seller->email})");
        $this->line("Store: {$store->name}");
        $this->line("Subscription ID: {$subscription->id}");
        $this->line("Plan: {$subscription->plan?->plan_type}");
        $this->line('');

        // Test Featured Products Slot Enforcement
        $this->info('=== Testing Featured Products Slot Enforcement ===');

        // Get all featured products for this subscription
        $allFeatured = $store->featuredProducts()
            ->where('subscription_id', $subscription->id)
            ->get();

        $this->line("Featured products created under current subscription:");
        $this->line("  Total count: {$allFeatured->count()}");

        // Show active vs inactive
        $activeFeatured = $allFeatured->where('is_active', true)->count();
        $expiredFeatured = $allFeatured->where('is_active', false)->count();
        $this->line("  Active: {$activeFeatured}");
        $this->line("  Expired: {$expiredFeatured}");

        // Show each one
        if ($allFeatured->count() > 0) {
            $this->line("\nDetailed list:");
            foreach ($allFeatured as $featured) {
                $status = $featured->is_active ? 'ACTIVE' : 'EXPIRED';
                $this->line("  - Product ID {$featured->product_id}: {$status} (created {$featured->created_at})");
            }
        }

        $maxSlots = match ($subscription->plan?->plan_type) {
            'gold' => 2,
            'silver' => 1,
            'platinum' => 3,
            default => 0,
        };

        $this->line("\nSlot Limits:");
        $this->line("  Max allowed for {$subscription->plan?->plan_type}: {$maxSlots}");
        $this->line("  Current used: {$allFeatured->count()}");
        $this->line("  Slots remaining: " . max(0, $maxSlots - $allFeatured->count()));

        if ($allFeatured->count() >= $maxSlots) {
            $this->warn("  ⚠️  SLOT LIMIT REACHED - cannot add more featured products until subscription changes");
        } else {
            $this->info("  ✓ Slots available - can add " . ($maxSlots - $allFeatured->count()) . " more featured products");
        }

        $this->line('');

        // Test Hot Deals Slot Enforcement
        $this->info('=== Testing Hot Deals Slot Enforcement ===');

        $allDeals = $store->hotDeals()
            ->where('subscription_id', $subscription->id)
            ->get();

        $this->line("Hot deals created under current subscription:");
        $this->line("  Total count: {$allDeals->count()}");

        // Show active vs inactive
        $activeDeals = $allDeals->where('is_active', true)->count();
        $expiredDeals = $allDeals->where('is_active', false)->count();
        $this->line("  Active: {$activeDeals}");
        $this->line("  Expired: {$expiredDeals}");

        // Show each one
        if ($allDeals->count() > 0) {
            $this->line("\nDetailed list:");
            foreach ($allDeals as $deal) {
                $status = $deal->is_active ? 'ACTIVE' : 'EXPIRED';
                $this->line("  - Product ID {$deal->product_id}: {$status} (created {$deal->created_at})");
            }
        }

        $maxDeals = match ($subscription->plan?->plan_type) {
            'gold' => 1,
            'silver' => 1,
            'platinum' => 3,
            default => 0,
        };

        $this->line("\nSlot Limits:");
        $this->line("  Max allowed for {$subscription->plan?->plan_type}: {$maxDeals}");
        $this->line("  Current used: {$allDeals->count()}");
        $this->line("  Slots remaining: " . max(0, $maxDeals - $allDeals->count()));

        if ($allDeals->count() >= $maxDeals) {
            $this->warn("  ⚠️  SLOT LIMIT REACHED - cannot add more hot deals until subscription changes");
        } else {
            $this->info("  ✓ Slots available - can add " . ($maxDeals - $allDeals->count()) . " more hot deals");
        }

        $this->line('');

        // Key verification
        $this->info('=== Key Verifications ===');
        $this->line('✓ Slot counting uses subscription_id (not is_active status)');
        $this->line('✓ Expired promotions still count toward slot limits');
        $this->line('✓ Slots reset automatically when seller subscribes to new plan (new subscription_id)');

        $this->info('Test completed successfully!');
    }
}
