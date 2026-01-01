<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\Admin\UserController;
use App\Http\Controllers\API\Admin\StoreController as AdminStoreController;
use App\Http\Controllers\API\Admin\SubscriptionController;
use App\Http\Controllers\API\Admin\SubscriptionPlanController;
use App\Http\Controllers\API\Admin\DocumentController;
use App\Http\Controllers\API\Admin\CategoryController;
use App\Http\Controllers\API\StoreController;
use App\Http\Controllers\API\SellerRegistrationController;
use App\Http\Controllers\API\Seller\ProductController;
use App\Http\Controllers\API\Seller\FeaturedProductController;
use App\Http\Controllers\API\Seller\PromotionController;
use App\Http\Controllers\API\Admin\ProductController as AdminProductController;
use App\Http\Controllers\API\Admin\SettingsController;

// Include authentication routes (they will be prefixed with /api automatically)
require __DIR__ . '/auth.php';

// Public display routes (no authentication required)
Route::get('hot-deals', [\App\Http\Controllers\API\DisplayController::class, 'hotDeals']);
Route::get('featured-products', [\App\Http\Controllers\API\DisplayController::class, 'featuredProducts']);
Route::get('showcase', [\App\Http\Controllers\API\DisplayController::class, 'homepageShowcase']);
Route::get('stores/{store}/products', [\App\Http\Controllers\API\DisplayController::class, 'storeProducts']);
Route::get('stores', [\App\Http\Controllers\API\DisplayController::class, 'allStores']); // Public stores list
Route::get('products/{product}', [\App\Http\Controllers\API\DisplayController::class, 'show']); // Single product
Route::get('products', [\App\Http\Controllers\API\DisplayController::class, 'allProducts']); // Public products list
Route::get('category-counts', [\App\Http\Controllers\API\DisplayController::class, 'categoryCounts']); // Category product counts

// Public subscription plans routes (no authentication required)
Route::get('subscription-plans', [SubscriptionPlanController::class, 'index']);
Route::get('subscription-plans/{plan}', [SubscriptionPlanController::class, 'show']);

// Public settings routes (for getting site settings)
Route::get('settings', [SettingsController::class, 'index']);
Route::patch('settings', [SettingsController::class, 'update']);

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    $profileImagePath = null;
    if ($user->profile_image_path) {
        $baseUrl = config('app.url');
        $profileImagePath = $baseUrl . '/storage/' . $user->profile_image_path;
    }

    return response()->json([
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'profile_image_path' => $profileImagePath,
        ]
    ]);
});

// Seller registration routes (authenticated only)
Route::middleware(['auth:sanctum'])->prefix('seller')->group(function () {
    Route::post('register', [SellerRegistrationController::class, 'store']);
    Route::get('registration/{store}/status', [SellerRegistrationController::class, 'status']);
});

// User store routes (authenticated only)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('my-store', [StoreController::class, 'myStore']);
    Route::patch('my-store', [StoreController::class, 'updateMyStore']);
    Route::post('my-store/upload-logo', [StoreController::class, 'uploadLogo']);
    Route::post('subscription/upgrade', [SubscriptionController::class, 'storeUpgrade']);
    Route::get('subscription/current', [SubscriptionController::class, 'current']);

    // Report routes
    Route::post('stores/{store}/report', [\App\Http\Controllers\API\StoreReportController::class, 'store']);

    // Profile routes
    Route::put('profile', [\App\Http\Controllers\API\ProfileController::class, 'update']);
    Route::post('change-password', [\App\Http\Controllers\API\ProfileController::class, 'changePassword']);
    Route::post('profile/upload-image', [\App\Http\Controllers\API\ProfileController::class, 'uploadProfileImage']);

    // Product routes for sellers
    Route::get('my-products', [ProductController::class, 'index']);
    Route::post('my-products', [ProductController::class, 'store']);
    Route::get('my-products/{product}', [ProductController::class, 'show']);
    Route::patch('my-products/{product}', [ProductController::class, 'update']);
    Route::delete('my-products/{product}', [ProductController::class, 'destroy']);

    // Featured Products and Hot Deals routes
    Route::post('products/{product}/feature', [FeaturedProductController::class, 'featureProduct']);
    Route::delete('products/{product}/unfeature', [FeaturedProductController::class, 'unfeatureProduct']);
    Route::post('hot-deals', [FeaturedProductController::class, 'createHotDeal']);
    Route::patch('hot-deals/{deal}', [FeaturedProductController::class, 'updateHotDeal']);
    Route::delete('hot-deals/{deal}', [FeaturedProductController::class, 'endHotDeal']);
    Route::get('featured-and-deals', [FeaturedProductController::class, 'getMyFeaturedAndDeals']);

    // Promotions - Check status and expiry
    Route::get('promotions', [PromotionController::class, 'index']);
    Route::post('promotions/{type}/{id}/expire', [PromotionController::class, 'expire']);
});

// Admin routes
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::resource('users', UserController::class);
    Route::get('stores', [AdminStoreController::class, 'index']);
    Route::get('stores/{store}', [AdminStoreController::class, 'show']);
    Route::patch('stores/{store}/approve', [AdminStoreController::class, 'approve']);
    Route::patch('stores/{store}/reject', [AdminStoreController::class, 'reject']);
    Route::patch('stores/{store}/suspend', [AdminStoreController::class, 'suspend']);

    // Store Reports routes
    Route::get('reports', [\App\Http\Controllers\API\StoreReportController::class, 'index']);
    Route::get('reports/{report}', [\App\Http\Controllers\API\StoreReportController::class, 'show']);
    Route::patch('reports/{report}/status', [\App\Http\Controllers\API\StoreReportController::class, 'updateStatus']);

    // Subscription routes
    Route::get('subscriptions', [SubscriptionController::class, 'index']);
    Route::get('subscriptions/{subscription}', [SubscriptionController::class, 'show']);
    Route::patch('subscriptions/{subscription}/approve', [SubscriptionController::class, 'approve']);
    Route::patch('subscriptions/{subscription}/reject', [SubscriptionController::class, 'reject']);
    Route::get('subscriptions/{subscription}/payment-receipt', [SubscriptionController::class, 'getPaymentReceipt']);
    Route::get('subscriptions/analytics/by-plan', [SubscriptionController::class, 'storesByPlan']);

    // Subscription Plans routes (only update requires admin)
    Route::get('subscription-plans', [SubscriptionPlanController::class, 'index']);
    Route::get('subscription-plans/{plan}', [SubscriptionPlanController::class, 'show']);
    Route::patch('subscription-plans/{plan}', [SubscriptionPlanController::class, 'update']);

    // Document routes
    Route::patch('documents/{document}/approve', [DocumentController::class, 'approve']);
    Route::patch('documents/{document}/reject', [DocumentController::class, 'reject']);

    // Category routes
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{category}', [CategoryController::class, 'show']);
    Route::post('categories', [CategoryController::class, 'store']);
    Route::patch('categories/{category}', [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

    // Product routes for admin
    Route::get('products', [AdminProductController::class, 'index']);
    Route::get('products/{product}', [AdminProductController::class, 'show']);
});
