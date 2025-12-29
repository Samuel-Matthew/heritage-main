<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'category_id',
        'name',
        'slug',
        'description',
        'old_price',
        'new_price',
        'specifications',
        'status',
        'is_featured',
    ];

    protected static function booted()
    {
        // Update category count when product is created
        static::created(function ($product) {
            if ($product->status === 'active') {
                $product->category()->increment('total_products');
            }
        });

        // Update category count when product is deleted
        static::deleted(function ($product) {
            if ($product->status === 'active') {
                $product->category()->decrement('total_products');
            }
        });

        // Handle status changes
        static::updated(function ($product) {
            $original = $product->getOriginal();

            // If status changed to active
            if ($original['status'] !== 'active' && $product->status === 'active') {
                $product->category()->increment('total_products');
            }
            // If status changed from active
            elseif ($original['status'] === 'active' && $product->status !== 'active') {
                $product->category()->decrement('total_products');
            }

            // If category changed (only for active products)
            if ($product->status === 'active' && $original['category_id'] !== $product->category_id) {
                Category::find($original['category_id'])?->decrement('total_products');
                $product->category()->increment('total_products');
            }
        });
    }

    protected $casts = [
        'specifications' => 'array',
        'is_featured' => 'boolean',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)
            ->where('is_primary', true);
    }

    public function exhibitions()
    {
        return $this->belongsToMany(
            Exhibition::class,
            'exhibition_products'
        );
    }

    public function featuredProduct()
    {
        return $this->hasOne(FeaturedProduct::class);
    }

    public function hotDeal()
    {
        return $this->hasOne(HotDeal::class);
    }

    // Check if product is currently featured
    public function isFeatured()
    {
        return $this->featuredProduct()->where('is_active', true)->exists();
    }

    // Check if product has active hot deal
    public function hasActiveDeal()
    {
        return $this->hotDeal()
            ->where('is_active', true)
            ->where('deal_start_at', '<=', now())
            ->where('deal_end_at', '>=', now())
            ->exists();
    }

    // Get active hot deal if exists
    public function getActiveDeal()
    {
        return $this->hotDeal()
            ->where('is_active', true)
            ->where('deal_start_at', '<=', now())
            ->where('deal_end_at', '>=', now())
            ->first();
    }
}

