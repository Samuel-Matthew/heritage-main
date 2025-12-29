<?php

namespace App\Http\Controllers\Api\Seller;

use App\Models\Product;
use App\Models\FeaturedProduct;
use App\Models\HotDeal;
use App\Jobs\ExpireFeaturedProductJob;
use App\Jobs\ExpireHotDealJob;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class FeaturedProductController extends Controller
{
    /**
     * Feature a product
     */
    public function featureProduct(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);

        // Verify product belongs to seller
        if ($product->store_id !== auth()->user()->store?->id) {
            return response()->json([
                'message' => 'Unauthorized: This product does not belong to your store',
            ], 403);
        }

        // Check if already featured
        if ($product->isFeatured()) {
            return response()->json([
                'message' => 'Product is already featured',
            ], 422);
        }

        // Get seller's plan type
        $store = auth()->user()->store;
        if (!$store) {
            return response()->json([
                'message' => 'You do not have a registered store',
            ], 422);
        }

        // Get plan type from latest subscription (regardless of status), or use basic as default
        $latestSubscription = $store->subscriptions()->latest()->first();
        $planType = $latestSubscription?->plan?->plan_type ?? 'basic';

        // Check plan eligibility - count ALL promotions (active or expired) created with current subscription
        // This ensures slots don't reset when promotions expire
        $maxFeaturedSlots = $this->getMaxFeaturedSlots($planType);
        $currentFeaturedCount = FeaturedProduct::where('store_id', $store->id)
            ->where('subscription_code', $latestSubscription?->subscription_code)
            ->count();

        if ($currentFeaturedCount >= $maxFeaturedSlots) {
            return response()->json([
                'message' => "Your {$planType} plan allows only {$maxFeaturedSlots} featured products. Please upgrade to feature more products.",
                'current_featured' => $currentFeaturedCount,
                'max_allowed' => $maxFeaturedSlots,
            ], 422);
        }


        // Set start and finish time based on plan
        $startTime = now();
        $finishTime = match ($planType) {
            'platinum' => $startTime->copy()->addDays(30),
            'gold' => $startTime->copy()->addDays(14),
            'silver' => $startTime->copy()->addDays(7),
            'basic' => $startTime->copy()->addDays(3),
            default => $startTime->copy()->addDays(3),
        };

        // Create featured product entry
        $featuredProduct = FeaturedProduct::create([
            'product_id' => $product->id,
            'store_id' => $store->id,
            'subscription_code' => $latestSubscription?->subscription_code,
            'plan_type' => $planType,
            'featured_at' => $startTime,
            'start_time' => $startTime,
            'finish_time' => $finishTime,
            'is_active' => true,
        ]);

        // Dispatch delayed job to expire featured product at finish_time
        ExpireFeaturedProductJob::dispatch($featuredProduct->id)
            ->delay($finishTime);

        return response()->json([
            'message' => 'Product featured successfully',
            'featured_product' => $featuredProduct,
        ], 201);
    }

    /**
     * Remove feature from product
     */
    public function unfeatureProduct(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);

        // Verify product belongs to seller
        if ($product->store_id !== auth()->user()->store?->id) {
            return response()->json([
                'message' => 'Unauthorized: This product does not belong to your store',
            ], 403);
        }

        $featuredProduct = $product->featuredProduct;

        if (!$featuredProduct) {
            return response()->json([
                'message' => 'Product is not featured',
            ], 422);
        }

        $featuredProduct->update([
            'is_active' => false,
            'rotated_out_at' => now(),
        ]);

        return response()->json([
            'message' => 'Product unfeatured successfully',
        ]);
    }

    /**
     * Create a hot deal for a product
     */
    public function createHotDeal(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'deal_price' => 'required|numeric|min:0',
            'deal_start_at' => 'required|date_format:Y-m-d\TH:i',
            'deal_end_at' => 'required|date_format:Y-m-d\TH:i|after:deal_start_at',
            'deal_description' => 'nullable|string',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Verify product belongs to seller
        if ($product->store_id !== auth()->user()->store?->id) {
            return response()->json([
                'message' => 'Unauthorized: This product does not belong to your store',
            ], 403);
        }

        // Check if already has active deal
        if ($product->hasActiveDeal()) {
            return response()->json([
                'message' => 'Product already has an active hot deal',
            ], 422);
        }

        // Get seller's plan type
        $store = auth()->user()->store;
        if (!$store) {
            return response()->json([
                'message' => 'You do not have a registered store',
            ], 422);
        }

        // Get plan type from latest subscription (regardless of status), or use basic as default
        $latestSubscription = $store->subscriptions()->latest()->first();
        $planType = $latestSubscription?->plan?->plan_type ?? 'basic';

        // Check plan eligibility - count ALL hot deals (active or expired) created with current subscription
        // This ensures slots don't reset when promotions expire
        $maxDeals = $this->getMaxHotDeals($planType);
        $currentDealsCount = HotDeal::where('store_id', $store->id)
            ->where('subscription_code', $latestSubscription?->subscription_code)
            ->count();

        if ($currentDealsCount >= $maxDeals) {
            return response()->json([
                'message' => "Your {$planType} plan allows only {$maxDeals} active hot deals. Please upgrade or end an existing deal.",
                'current_deals' => $currentDealsCount,
                'max_allowed' => $maxDeals,
            ], 422);
        }

        // Calculate discount percentage
        $originalPrice = (float) $product->new_price;
        $dealPrice = (float) $validated['deal_price'];
        $discountPercentage = round((($originalPrice - $dealPrice) / $originalPrice) * 100);

        // Create hot deal
        $hotDeal = HotDeal::create([
            'product_id' => $product->id,
            'store_id' => $store->id,
            'subscription_code' => $latestSubscription?->subscription_code,
            'plan_type' => $planType,
            'original_price' => $originalPrice,
            'deal_price' => $dealPrice,
            'discount_percentage' => $discountPercentage,
            'deal_start_at' => $validated['deal_start_at'],
            'deal_end_at' => $validated['deal_end_at'],
            'deal_description' => $validated['deal_description'] ?? null,
            'is_active' => true,
            'activated_at' => $validated['deal_start_at'],
        ]);

        // Dispatch delayed job to expire hot deal at deal_end_at
        ExpireHotDealJob::dispatch($hotDeal->id)
            ->delay($hotDeal->deal_end_at);

        return response()->json([
            'message' => 'Hot deal created successfully',
            'hot_deal' => $hotDeal,
        ], 201);
    }

    /**
     * Update a hot deal
     */
    public function updateHotDeal(Request $request, $dealId)
    {
        $validated = $request->validate([
            'deal_price' => 'nullable|numeric|min:0',
            'deal_end_at' => 'nullable|date|after:now',
            'deal_description' => 'nullable|string',
        ]);

        $hotDeal = HotDeal::where('store_id', auth()->user()->store->id)
            ->findOrFail($dealId);

        $updateData = [];

        if (isset($validated['deal_price'])) {
            $originalPrice = (float) $hotDeal->original_price;
            $dealPrice = (float) $validated['deal_price'];
            $updateData['deal_price'] = $dealPrice;
            $updateData['discount_percentage'] = round((($originalPrice - $dealPrice) / $originalPrice) * 100);
        }

        if (isset($validated['deal_end_at'])) {
            $updateData['deal_end_at'] = $validated['deal_end_at'];
        }

        if (isset($validated['deal_description'])) {
            $updateData['deal_description'] = $validated['deal_description'];
        }

        $hotDeal->update($updateData);

        return response()->json([
            'message' => 'Hot deal updated successfully',
            'hot_deal' => $hotDeal,
        ]);
    }

    /**
     * End a hot deal early
     */
    public function endHotDeal($dealId)
    {
        $hotDeal = HotDeal::where('store_id', auth()->user()->store->id)
            ->findOrFail($dealId);

        $hotDeal->update([
            'is_active' => false,
            'deal_end_at' => now(),
            'deactivated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Hot deal ended successfully',
        ]);
    }

    /**
     * Get seller's featured products and hot deals
     */
    public function getMyFeaturedAndDeals()
    {
        $store = auth()->user()->store;

        // Get the LATEST subscription only
        $latestSubscription = $store->subscriptions()->latest()->first();

        if (!$latestSubscription) {
            return response()->json([
                'featured_products' => [],
                'hot_deals' => [],
                'plan_type' => 'basic',
                'featured_slots_used' => 0,
                'featured_slots_max' => 0,
                'hot_deals_used' => 0,
                'hot_deals_max' => 0,
            ]);
        }

        // Filter by LATEST subscription code only
        $featured = FeaturedProduct::where('store_id', $store->id)
            ->where('subscription_code', $latestSubscription->subscription_code)
            ->where('is_active', true)
            ->with('product')
            ->get();

        $hotDeals = HotDeal::where('store_id', $store->id)
            ->where('subscription_code', $latestSubscription->subscription_code)
            ->where('is_active', true)
            ->with('product')
            ->get();

        return response()->json([
            'featured_products' => $featured,
            'hot_deals' => $hotDeals,
            'plan_type' => $latestSubscription->plan_type ?? 'basic',
            'featured_slots_used' => $featured->count(),
            'featured_slots_max' => $this->getMaxFeaturedSlots($latestSubscription->plan_type ?? 'basic'),
            'hot_deals_used' => $hotDeals->count(),
            'hot_deals_max' => $this->getMaxHotDeals($latestSubscription->plan_type ?? 'basic'),
        ]);
    }

    /**
     * Get plan-based maximum featured slots
     */
    private function getMaxFeaturedSlots($planType)
    {
        return match ($planType) {
            'platinum' => 20,
            'gold' => 10,
            'silver' => 5,
            'basic' => 2,
            default => 2,
        };
    }

    /**
     * Get plan-based maximum hot deals
     */
    private function getMaxHotDeals($planType)
    {
        return match ($planType) {
            'platinum' => 15,
            'gold' => 8,
            'silver' => 4,
            'basic' => 1,
            default => 1,
        };
    }
}
