<?php

namespace App\Http\Controllers\API;

use App\Models\FeaturedProduct;
use App\Models\HotDeal;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DisplayController extends Controller
{
    /**
     * Get hot deals for homepage (public)
     * Ordered by plan type (platinum first) and recency
     */
    public function hotDeals(Request $request)
    {
        $limit = $request->get('limit', 6);

        $hotDeals = HotDeal::where('is_active', true)
            ->where('deal_start_at', '<=', now())
            ->where('deal_end_at', '>=', now())
            ->with([
                'product.images',
                'product.store'
            ])
            ->orderByRaw("FIELD(plan_type, 'platinum', 'gold', 'silver', 'basic')")
            ->orderBy('deal_start_at', 'desc')
            ->paginate($limit);

        return response()->json($hotDeals);
    }

    /**
     * Get featured products for homepage (public)
     * Ordered by plan type and rotation logic
     */
    public function featuredProducts(Request $request)
    {
        $limit = $request->get('limit', 8);

        $featuredProducts = FeaturedProduct::where('is_active', true)
            ->with([
                'product.images',
                'product.store'
            ])
            ->orderByRaw("FIELD(plan_type, 'platinum', 'gold', 'silver', 'basic')")
            ->orderBy('featured_at', 'desc')
            ->paginate($limit);

        return response()->json($featuredProducts);
    }

    /**
     * Get combined hot deals and featured products (homepage display)
     */
    public function homepageShowcase(Request $request)
    {
        $hotDealsLimit = $request->get('hot_deals_limit', 6);
        $featuredLimit = $request->get('featured_limit', 8);

        // Get active hot deals
        $hotDeals = HotDeal::where('is_active', true)
            ->where('deal_start_at', '<=', now())
            ->where('deal_end_at', '>=', now())
            ->with([
                'product.images',
                'product.store'
            ])
            ->orderByRaw("FIELD(plan_type, 'platinum', 'gold', 'silver', 'basic')")
            ->orderBy('deal_start_at', 'desc')
            ->limit($hotDealsLimit)
            ->get();

        // Get featured products
        $featuredProducts = FeaturedProduct::where('is_active', true)
            ->with([
                'product.images',
                'product.store'
            ])
            ->orderByRaw("FIELD(plan_type, 'platinum', 'gold', 'silver', 'basic')")
            ->orderBy('featured_at', 'desc')
            ->limit($featuredLimit)
            ->get();

        return response()->json([
            'hot_deals' => $hotDeals,
            'featured_products' => $featuredProducts,
            'total_hot_deals' => $hotDeals->count(),
            'total_featured' => $featuredProducts->count(),
        ]);
    }

    /**
     * Get all products for public browsing (filtered, paginated)
     */
    public function allProducts(Request $request)
    {
        try {
            $limit = $request->get('limit', 12);
            $category = $request->get('category');
            $search = $request->get('search');

            $query = Product::where('status', 'active')
                ->with(['images', 'store', 'category']);

            // Filter by category if provided
            // The category parameter is the category name (string)
            if ($category) {
                $query->whereHas('category', function ($q) use ($category) {
                    $q->where('name', $category);
                });
            }

            // Filter by search term
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $products = $query->orderBy('created_at', 'desc')
                ->paginate($limit);

            return response()->json($products);
        } catch (\Exception $e) {
            \Log::error('Error fetching products: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch products'], 500);
        }
    }

    /**
     * Get a single product by ID (public endpoint)
     */
    public function show($productId)
    {
        try {
            $product = Product::where('status', 'active')
                ->with(['images', 'store', 'category'])
                ->find($productId);

            if (!$product) {
                return response()->json(['error' => 'Product not found'], 404);
            }

            return response()->json(['data' => $product]);
        } catch (\Exception $e) {
            \Log::error('Error fetching product: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch product'], 500);
        }
    }

    /**
     * Get category counts (public endpoint)
     */
    public function categoryCounts(Request $request)
    {
        $counts = Category::where('is_active', true)
            ->pluck('total_products', 'name');

        return response()->json($counts);
    }

    /**
     * Get products by a specific store with features and deals
     */
    public function storeProducts(Request $request, $storeId)
    {
        try {
            $limit = $request->get('limit', 12);

            $products = Product::where('store_id', $storeId)
                ->where('status', 'active')
                ->with(['images', 'store.documents', 'category'])
                ->orderBy('created_at', 'desc')
                ->paginate($limit);

            // Add company_logo to store data
            $products->getCollection()->transform(function ($product) {
                if ($product->store && $product->store->documents) {
                    $logoDoc = $product->store->documents->firstWhere('type', 'company_logo');
                    $product->store->setAttribute('company_logo', $logoDoc ? $logoDoc->file_path : null);
                }
                return $product;
            });

            return response()->json($products);
        } catch (\Exception $e) {
            \Log::error('Error fetching store products: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch store products'], 500);
        }
    }

    /**
     * Get all verified/approved stores for public browsing (paginated)
     */
    public function allStores(Request $request)
    {
        try {
            $limit = $request->get('limit', 12);

            $stores = \App\Models\Store::where('status', 'approved')
                ->with(['documents', 'products'])
                ->withCount('products')
                ->orderBy('created_at', 'desc')
                ->paginate($limit);

            // Transform each store to include logo from documents
            $stores->getCollection()->transform(function ($store) {
                $logoDoc = $store->documents->firstWhere('type', 'company_logo');
                $store->setAttribute('company_logo', $logoDoc ? $logoDoc->file_path : null);
                return $store;
            });

            return response()->json($stores);
        } catch (\Exception $e) {
            \Log::error('Error fetching stores: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch stores'], 500);
        }
    }

    /**
     * Check if auto-deactivate expired deals (can be run by scheduler)
     */
    public function autoDeactivateExpiredDeals()
    {
        $expiredDeals = HotDeal::where('is_active', true)
            ->where('deal_end_at', '<', now())
            ->update([
                'is_active' => false,
                'deactivated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Auto-deactivated expired deals',
            'count' => $expiredDeals,
        ]);
    }
}
