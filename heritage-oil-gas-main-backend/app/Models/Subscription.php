<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'subscription_plan_id',
        'payment_receipt_path',
        'starts_at',
        'ends_at',
        'status',
        'activated_by',
        'subscription_code',
        'rejection_reason',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function activatedBy()
    {
        return $this->belongsTo(User::class, 'activated_by');
    }

    /**
     * Auto-generate subscription code before creating
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($subscription) {
            if (!$subscription->subscription_code) {
                $subscription->subscription_code = 'SUB-' . now()->format('Ymd') . '-' . str_pad($subscription->store_id, 3, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
            }
        });
    }
}

