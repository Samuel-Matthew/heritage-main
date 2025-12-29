<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Get all products across all stores (admin only)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $perPage = $request->query('per_page', 15);
        $search = $request->query('search', '');

        $query = Product::with(['category', 'store', 'images']);

        // Search by name or description
        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        $products = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'data' => collect($products->items())->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'description' => $product->description,
                    'category_id' => $product->category_id,
                    'category' => $product->category?->name ?? 'Uncategorized',
                    'store_id' => $product->store_id,
                    'store' => $product->store?->name ?? 'Unknown Store',
                    'status' => $product->status,
                    'is_featured' => $product->is_featured,
                    'old_price' => $product->old_price,
                    'new_price' => $product->new_price,
                    'image' => $product->primaryImage?->image_path ?? null,
                    'images' => $product->images->map(fn($img) => [
                        'id' => $img->id,
                        'path' => str_starts_with($img->image_path, '/storage/') ? $img->image_path : '/storage/' . ltrim($img->image_path, '/'),
                        'is_primary' => $img->is_primary,
                    ]),
                    'specifications' => $product->specifications ?? [],
                    'created_at' => $product->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $product->updated_at->format('Y-m-d H:i:s'),
                ];
            }),
            'pagination' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ]
        ]);
    }

    /**
     * Get a specific product (admin only)
     */
    public function show(Request $request, Product $product)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->load(['category', 'store', 'images']);

        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'category_id' => $product->category_id,
            'category' => $product->category->name ?? null,
            'store_id' => $product->store_id,
            'store' => $product->store->name ?? null,
            'status' => $product->status,
            'is_featured' => $product->is_featured,
            'old_price' => $product->old_price,
            'new_price' => $product->new_price,
            'specifications' => $product->specifications ?? [],
            'images' => $product->images->map(fn($img) => [
                'id' => $img->id,
                'path' => str_starts_with($img->image_path, '/storage/') ? $img->image_path : '/storage/' . ltrim($img->image_path, '/'),
                'is_primary' => $img->is_primary,
            ]),
            'created_at' => $product->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $product->updated_at->format('Y-m-d H:i:s'),
        ]);
    }
}
