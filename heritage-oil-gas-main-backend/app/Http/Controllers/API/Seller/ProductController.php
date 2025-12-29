<?php

namespace App\Http\Controllers\API\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Get all products for the authenticated seller
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Get seller's store
        $store = Store::where('user_id', $user->id)->first();

        if (!$store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        // Get products with relationships
        $products = Product::where('store_id', $store->id)
            ->with(['category', 'images'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'description' => $product->description,
                    'category_id' => $product->category_id,
                    'category' => $product->category?->name ?? 'Uncategorized',
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
        ]);
    }

    /**
     * Create a new product
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Get seller's store
        $store = Store::where('user_id', $user->id)->first();

        if (!$store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        // Check product limit from subscription plan
        $activeSubscription = $store->activeSubscription;
        if ($activeSubscription && $activeSubscription->plan) {
            $productLimit = $activeSubscription->plan->product_limit;
            $currentCount = $store->products()->count();

            if ($currentCount >= $productLimit) {
                return response()->json([
                    'message' => 'Product limit reached for your subscription plan',
                    'product_limit' => $productLimit,
                    'current_count' => $currentCount,
                ], 403);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'old_price' => 'nullable|numeric|min:0',
            'new_price' => 'nullable|numeric|min:0',
            'specifications' => 'nullable|string',
            'status' => 'sometimes|in:draft,active,suspended',
            'images' => 'nullable|array|max:5',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        // Parse specifications if it's a JSON string
        if (isset($validated['specifications']) && is_string($validated['specifications'])) {
            $validated['specifications'] = json_decode($validated['specifications'], true);
        }

        // Map category name to category_id
        $categoryName = $validated['category'];
        $category = \App\Models\Category::where('name', $categoryName)->first();
        if ($category) {
            $validated['category_id'] = $category->id;
        } else {
            // If category doesn't exist, use the first category or a default
            $defaultCategory = \App\Models\Category::first();
            $validated['category_id'] = $defaultCategory ? $defaultCategory->id : 1;
        }

        // Remove fields that aren't in the database table
        unset($validated['category']);

        $validated['store_id'] = $store->id;
        $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
        $validated['status'] = $validated['status'] ?? 'active';

        $product = Product::create($validated);

        // Handle image uploads
        if ($request->hasFile('images')) {
            $images = $request->file('images');
            $isPrimary = true;

            foreach ($images as $image) {
                $path = $image->store('products', 'public');

                \App\Models\ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => '/storage/' . $path,
                    'is_primary' => $isPrimary,
                ]);

                $isPrimary = false;
            }
        }

        // Reload product with images
        $product->load('images');

        return response()->json([
            'message' => 'Product created successfully',
            'data' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category,
                'description' => $product->description,
                'old_price' => $product->old_price,
                'new_price' => $product->new_price,
                'status' => $product->status,
                'specifications' => $product->specifications,
                'images' => $product->images->map(fn($img) => [
                    'id' => $img->id,
                    'image_path' => $img->image_path,
                    'is_primary' => $img->is_primary,
                ]),
                'created_at' => $product->created_at->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    /**
     * Get a specific product
     */
    public function show(Request $request, Product $product)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $store = Store::where('user_id', $user->id)->first();

        if (!$store || $product->store_id !== $store->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->load(['category', 'images']);

        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'category_id' => $product->category_id,
            'category' => $product->category->name ?? null,
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

    /**
     * Update a product
     */
    public function update(Request $request, Product $product)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $store = Store::where('user_id', $user->id)->first();

        if (!$store || $product->store_id !== $store->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'old_price' => 'sometimes|nullable|numeric|min:0',
            'new_price' => 'sometimes|nullable|numeric|min:0',
            'specifications' => 'nullable|json',
            'status' => 'sometimes|in:draft,active,suspended',
            'is_featured' => 'sometimes|boolean',
            'images.*' => 'nullable|image|mimes:jpeg,png,gif,jpg|max:10240',
            'keep_images' => 'nullable|json',
        ]);

        // Update basic fields
        if (isset($validated['name'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
        }

        // Handle category
        if (isset($validated['category'])) {
            $categoryName = $validated['category'];
            $category = \App\Models\Category::where('name', $categoryName)->first();
            if ($category) {
                $validated['category_id'] = $category->id;
            } else {
                $defaultCategory = \App\Models\Category::first();
                $validated['category_id'] = $defaultCategory ? $defaultCategory->id : 1;
            }
            unset($validated['category']);
        }

        // Handle specifications (parse JSON if string)
        if (isset($validated['specifications'])) {
            if (is_string($validated['specifications'])) {
                $validated['specifications'] = json_decode($validated['specifications'], true);
            }
        }

        $product->update($validated);

        // Handle image deletion and addition
        $keepImageIds = [];
        if ($request->has('keep_images')) {
            $keepImageIds = json_decode($request->get('keep_images'), true) ?? [];
        }

        // Delete images not in keep list
        $product->images()
            ->whereNotIn('id', $keepImageIds)
            ->delete();

        // Add new images
        if ($request->hasFile('images')) {
            $newImages = $request->file('images');
            $isFirstImage = $product->images()->count() === 0;

            foreach ($newImages as $index => $image) {
                $path = $image->store('products', 'public');

                $product->images()->create([
                    'image_path' => '/storage/' . $path,
                    'is_primary' => $isFirstImage && $index === 0,
                ]);

                $isFirstImage = false;
            }
        }

        // Refresh relationships
        $product->load(['images']);

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category,
                'description' => $product->description,
                'price' => $product->price,
                'status' => $product->status,
                'specifications' => $product->specifications,
                'images' => $product->images->map(fn($img) => [
                    'id' => $img->id,
                    'image_path' => $img->image_path,
                    'is_primary' => $img->is_primary,
                ]),
                'updated_at' => $product->updated_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Delete a product
     */
    public function destroy(Request $request, Product $product)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $store = Store::where('user_id', $user->id)->first();

        if (!$store || $product->store_id !== $store->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }
}

