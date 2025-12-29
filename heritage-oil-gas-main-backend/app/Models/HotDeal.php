<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class HotDeal extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'store_id',
        'subscription_code',
        'plan_type',
        'original_price',
        'deal_price',
        'discount_percentage',
        'deal_start_at',
        'deal_end_at',
        'deal_description',
        'is_active',
        'activated_at',
        'deactivated_at',
    ];

    protected $casts = [
        'original_price' => 'decimal:2',
        'deal_price' => 'decimal:2',
        'deal_start_at' => 'datetime',
        'deal_end_at' => 'datetime',
        'activated_at' => 'datetime',
        'deactivated_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    // Check if deal is currently active and within time window
    public function isCurrentlyActive()
    {
        return $this->is_active
            && $this->deal_start_at <= now()
            && $this->deal_end_at >= now();
    }
}
