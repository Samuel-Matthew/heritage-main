<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\HotDeal;
use Carbon\Carbon;

class ExpireHotDeals extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hot-deals:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire hot deals after their end time.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $expired = 0;
        $active = HotDeal::where('is_active', true)
            ->where('deal_end_at', '<', $now)
            ->get();
        foreach ($active as $deal) {
            $deal->is_active = false;
            $deal->deactivated_at = $now;
            $deal->save();
            $expired++;
        }
        $this->info("Expired $expired hot deals.");
    }
}
