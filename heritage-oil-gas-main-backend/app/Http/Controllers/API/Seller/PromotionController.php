<?php

namespace App\Http\Controllers\API\Seller;

use App\Models\FeaturedProduct;
use App\Models\HotDeal;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PromotionController extends Controller
{
    /**
     * Get all promotions with their expiry status
     */
    public function index()
    {
        $store = auth()->user()->store;

        if (!$store) {
            return response()->json(['message' => 'No store found'], 404);
        }

        // Get the latest (current) subscription
        $latestSubscription = $store->subscriptions()->latest()->first();

        if (!$latestSubscription) {
            return response()->json([
                'featured_products' => [],
                'hot_deals' => [],
            ]);
        }

        // Auto-expire any promotions that should be expired
        $this->expirePromotions($store);

        // Get featured products from CURRENT subscription only
        $featured = FeaturedProduct::where('store_id', $store->id)
            ->where('subscription_code', $latestSubscription->subscription_code)
            ->with('product')
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'product_id' => $f->product_id,
                'type' => 'featured',
                'product_name' => $f->product->name ?? 'N/A',
                'plan_type' => $f->plan_type,
                'finish_time' => $f->finish_time,
                'is_active' => $f->is_active,
                'expired' => $f->finish_time && now() > $f->finish_time,
                'days_left' => $f->finish_time ? now()->diffInDays($f->finish_time, false) : null,
            ]);

        // Get hot deals from CURRENT subscription only
        $deals = HotDeal::where('store_id', $store->id)
            ->where('subscription_code', $latestSubscription->subscription_code)
            ->with('product')
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'product_id' => $d->product_id,
                'type' => 'hot_deal',
                'product_name' => $d->product->name ?? 'N/A',
                'plan_type' => $d->plan_type,
                'deal_end_at' => $d->deal_end_at,
                'discount' => $d->discount_percentage . '%',
                'is_active' => $d->is_active,
                'expired' => $d->deal_end_at && now() > $d->deal_end_at,
                'days_left' => $d->deal_end_at ? now()->diffInDays($d->deal_end_at, false) : null,
            ]);

        return response()->json([
            'featured_products' => $featured,
            'hot_deals' => $deals,
        ]);
    }

    /**
     * Manually expire a promotion now
     */
    public function expire($type, $id)
    {
        $store = auth()->user()->store;

        if ($type === 'featured') {
            $promo = FeaturedProduct::where('store_id', $store->id)->findOrFail($id);
            $promo->update(['is_active' => false]);
            return response()->json(['message' => 'Featured product expired']);
        }

        if ($type === 'hot_deal') {
            $promo = HotDeal::where('store_id', $store->id)->findOrFail($id);
            $promo->update(['is_active' => false]);
            return response()->json(['message' => 'Hot deal expired']);
        }

        return response()->json(['message' => 'Invalid type'], 400);
    }

    /**
     * Auto-expire promotions that passed their expiry time
     */
    private function expirePromotions($store)
    {
        // Expire featured products
        FeaturedProduct::where('store_id', $store->id)
            ->where('is_active', true)
            ->where('finish_time', '<', now())
            ->update(['is_active' => false]);

        // Expire hot deals
        HotDeal::where('store_id', $store->id)
            ->where('is_active', true)
            ->where('deal_end_at', '<', now())
            ->update(['is_active' => false]);
    }
}
