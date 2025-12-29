<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FeaturedProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'store_id',
        'subscription_code',
        'plan_type',
        'slot_position',
        'featured_at',
        'start_time',
        'finish_time',
        'rotated_out_at',
        'is_active',
    ];

    protected $casts = [
        'featured_at' => 'datetime',
        'start_time' => 'datetime',
        'finish_time' => 'datetime',
        'rotated_out_at' => 'datetime',
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
}
