<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;

class ExpireSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and expire subscriptions that have passed their end date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();

        // Find all active subscriptions that have ended
        $expiredSubscriptions = Subscription::where('status', 'active')
            ->where('ends_at', '<=', $now)
            ->get();

        foreach ($expiredSubscriptions as $subscription) {
            // Update subscription status to suspended
            $subscription->update([
                'status' => 'suspended',
            ]);

            // Reset store subscription back to basic
            $subscription->store->update([
                'subscription' => 'basic',
            ]);

            $this->info("Expired subscription ID {$subscription->id} for store {$subscription->store->name}");
        }

        $this->info("Total expired subscriptions processed: {$expiredSubscriptions->count()}");
    }
}
