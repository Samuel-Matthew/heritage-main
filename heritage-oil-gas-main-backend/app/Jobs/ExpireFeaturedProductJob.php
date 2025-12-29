<?php

namespace App\Jobs;

use App\Models\FeaturedProduct;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ExpireFeaturedProductJob implements ShouldQueue
{
    use Queueable;

    protected $featuredProductId;

    public function __construct($featuredProductId)
    {
        $this->featuredProductId = $featuredProductId;
    }

    public function handle(): void
    {
        $featured = FeaturedProduct::find($this->featuredProductId);

        if ($featured && $featured->is_active) {
            $featured->update(['is_active' => false]);
        }
    }
}
