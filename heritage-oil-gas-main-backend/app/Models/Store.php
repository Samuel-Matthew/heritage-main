<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'state',
        'address',
        'city',
        'phone',
        'alternate_phone',
        'email',
        'status',
        'subscription',
        'subscription_plan_status',
        'approved_at',
        'rejection_reason',
        'suspension_reason',
        'rc_number',
        'business_lines',
        'contact_person',
        'website',
        'opening_hours',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function documents()
    {
        return $this->hasMany(StoreDocument::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active')
            ->latestOfMany();
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function featuredProducts()
    {
        return $this->hasMany(FeaturedProduct::class);
    }

    public function hotDeals()
    {
        return $this->hasMany(HotDeal::class);
    }

    public function subscription()
    {
        return $this->activeSubscription();
    }
}

