<?php

namespace App\Http\Controllers\API\Seller;

use App\Models\FeaturedProduct;
use App\Models\HotDeal;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PromotionStatusController extends Controller
{
    /**
     * Get all promotions (featured products + hot deals) with their status
     */
    public function index(Request $request)
    {
        $store = auth()->user()->store;

        if (!$store) {
            return response()->json([
                'message' => 'No store found',
            ], 404);
        }

        // Get all featured products
        $featuredProducts = $store->featuredProducts()
            ->with('product')
            ->get()
            ->map(fn($featured) => [
                'id' => $featured->id,
                'type' => 'featured',
                'product_id' => $featured->product_id,
                'product_name' => $featured->product->name ?? 'N/A',
                'plan_type' => $featured->plan_type,
                'start_time' => $featured->start_time,
                'finish_time' => $featured->finish_time,
                'is_active' => $featured->is_active,
                'status' => $featured->is_active ? 'Active' : 'Expired',
                'days_remaining' => $featured->is_active && $featured->finish_time
                    ? now()->diffInDays($featured->finish_time, false)
                    : 0,
            ]);

        // Get all hot deals
        $hotDeals = $store->hotDeals()
            ->with('product')
            ->get()
            ->map(fn($deal) => [
                'id' => $deal->id,
                'type' => 'hot_deal',
                'product_id' => $deal->product_id,
                'product_name' => $deal->product->name ?? 'N/A',
                'plan_type' => $deal->plan_type,
                'original_price' => $deal->original_price,
                'deal_price' => $deal->deal_price,
                'discount_percentage' => $deal->discount_percentage,
                'deal_start_at' => $deal->deal_start_at,
                'deal_end_at' => $deal->deal_end_at,
                'is_active' => $deal->is_active,
                'status' => $deal->is_active ? 'Active' : 'Expired',
                'days_remaining' => $deal->is_active && $deal->deal_end_at
                    ? now()->diffInDays($deal->deal_end_at, false)
                    : 0,
            ]);

        return response()->json([
            'featured_products' => $featuredProducts,
            'hot_deals' => $hotDeals,
            'total_active_promotions' => $featuredProducts->where('is_active', true)->count() +
                $hotDeals->where('is_active', true)->count(),
        ]);
    }

    /**
     * Get single promotion details
     */
    public function show(Request $request, $type, $id)
    {
        $store = auth()->user()->store;

        if ($type === 'featured') {
            $promotion = FeaturedProduct::where('store_id', $store->id)
                ->with('product')
                ->findOrFail($id);

            return response()->json([
                'type' => 'featured',
                'id' => $promotion->id,
                'product' => $promotion->product,
                'plan_type' => $promotion->plan_type,
                'start_time' => $promotion->start_time,
                'finish_time' => $promotion->finish_time,
                'is_active' => $promotion->is_active,
                'status' => $promotion->is_active ? 'Active' : 'Expired',
                'days_remaining' => $promotion->is_active && $promotion->finish_time
                    ? now()->diffInDays($promotion->finish_time, false)
                    : 0,
            ]);
        } elseif ($type === 'hot_deal') {
            $promotion = HotDeal::where('store_id', $store->id)
                ->with('product')
                ->findOrFail($id);

            return response()->json([
                'type' => 'hot_deal',
                'id' => $promotion->id,
                'product' => $promotion->product,
                'plan_type' => $promotion->plan_type,
                'original_price' => $promotion->original_price,
                'deal_price' => $promotion->deal_price,
                'discount_percentage' => $promotion->discount_percentage,
                'deal_start_at' => $promotion->deal_start_at,
                'deal_end_at' => $promotion->deal_end_at,
                'is_active' => $promotion->is_active,
                'status' => $promotion->is_active ? 'Active' : 'Expired',
                'days_remaining' => $promotion->is_active && $promotion->deal_end_at
                    ? now()->diffInDays($promotion->deal_end_at, false)
                    : 0,
            ]);
        }

        return response()->json(['message' => 'Invalid promotion type'], 400);
    }
}
