<?php

namespace App\Jobs;

use App\Models\HotDeal;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ExpireHotDealJob implements ShouldQueue
{
    use Queueable;

    protected $hotDealId;

    public function __construct($hotDealId)
    {
        $this->hotDealId = $hotDealId;
    }

    public function handle(): void
    {
        $deal = HotDeal::find($this->hotDealId);

        if ($deal && $deal->is_active) {
            $deal->update(['is_active' => false]);
        }
    }
}
