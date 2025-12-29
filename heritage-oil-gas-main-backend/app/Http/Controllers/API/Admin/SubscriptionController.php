<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Get all subscriptions with filters
     */
    public function index(Request $request)
    {
        $query = Subscription::with('store.owner', 'plan');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by plan
        if ($request->has('plan') && $request->plan !== 'all') {
            $planSlug = $request->plan;
            $query->whereHas('plan', function ($q) use ($planSlug) {
                $q->where('slug', $planSlug);
            });
        }

        // Search by store name or owner name
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('store', function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhereHas('owner', function ($q) use ($search) {
                        $q->where('name', 'like', "%$search%");
                    });
            });
        }

        // Sort by creation date descending
        $subscriptions = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $subscriptions->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'store_id' => $sub->store_id,
                    'store_name' => $sub->store->name,
                    'owner_name' => $sub->store->owner->name,
                    'plan_id' => $sub->plan->id,
                    'plan_name' => $sub->plan->slug,
                    'plan_display' => $sub->plan->name,
                    'price' => $sub->plan->price,
                    'product_limit' => $sub->plan->product_limit,
                    'status' => $sub->status,
                    'starts_at' => $sub->starts_at ? $sub->starts_at->format('Y-m-d') : null,
                    'ends_at' => $sub->ends_at ? $sub->ends_at->format('Y-m-d') : null,
                    'payment_receipt_path' => $sub->payment_receipt_path,
                    'created_at' => $sub->created_at->format('Y-m-d'),
                ];
            }),
        ]);
    }

    /**
     * Get current logged-in user's subscription
     */
    public function current(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->store) {
            return response()->json([
                'data' => null,
            ]);
        }

        $subscription = Subscription::where('store_id', $user->store->id)
            ->with('plan')
            ->latest()
            ->first();

        if (!$subscription) {
            return response()->json([
                'data' => null,
            ]);
        }

        // Check if subscription has expired and auto-expire it
        if ($subscription->status === 'active' && $subscription->ends_at && $subscription->ends_at <= now()) {
            $subscription->update([
                'status' => 'expired',
            ]);
            $user->store->update([
                'subscription' => 'basic',
            ]);

            // Suspend all products for this store when subscription expires
            $user->store->products()->update([
                'status' => 'suspended',
            ]);
        }

        return response()->json([
            'data' => [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'plan_id' => $subscription->plan->id,
                'plan_name' => $subscription->plan->name,
                'plan_slug' => $subscription->plan->slug,
                'price' => $subscription->plan->price,
                'product_limit' => $subscription->plan->product_limit,
                'starts_at' => $subscription->starts_at ? $subscription->starts_at->format('Y-m-d H:i:s') : null,
                'ends_at' => $subscription->ends_at ? $subscription->ends_at->format('Y-m-d H:i:s') : null,
                'approved_at' => $subscription->approved_at ? $subscription->approved_at->format('Y-m-d H:i:s') : null,
                'created_at' => $subscription->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Get subscription details
     */
    public function show(Subscription $subscription)
    {
        $subscription->load('store.owner', 'plan', 'activatedBy');

        return response()->json([
            'id' => $subscription->id,
            'store_id' => $subscription->store_id,
            'store_name' => $subscription->store->name,
            'owner_name' => $subscription->store->owner->name,
            'plan_name' => $subscription->plan->name,
            'plan_slug' => $subscription->plan->slug,
            'price' => $subscription->plan->price,
            'product_limit' => $subscription->plan->product_limit,
            'status' => $subscription->status,
            'starts_at' => $subscription->starts_at ? $subscription->starts_at->format('Y-m-d') : null,
            'ends_at' => $subscription->ends_at ? $subscription->ends_at->format('Y-m-d') : null,
            'payment_receipt_path' => $subscription->payment_receipt_path,
            'activated_by' => $subscription->activatedBy?->name,
            'created_at' => $subscription->created_at->format('Y-m-d H:i'),
        ]);
    }

    /**
     * Approve a pending subscription
     */
    public function approve(Request $request, Subscription $subscription)
    {
        if ($subscription->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending subscriptions can be approved',
            ], 400);
        }

        try {
            $now = now();
            $subscription->update([
                'status' => 'active',
                'starts_at' => $now,
                'ends_at' => $now->copy()->addMonth(),
                'approved_at' => $now,
                'activated_by' => $request->user()->id,
            ]);

            // Update store's subscription field
            $subscription->store->update([
                'subscription' => $subscription->plan->slug,
            ]);

            return response()->json([
                'message' => 'Subscription approved successfully',
                'subscription' => [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'starts_at' => $subscription->starts_at ? $subscription->starts_at->format('Y-m-d H:i:s') : null,
                    'ends_at' => $subscription->ends_at ? $subscription->ends_at->format('Y-m-d H:i:s') : null,
                    'approved_at' => $subscription->approved_at ? $subscription->approved_at->format('Y-m-d H:i:s') : null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve subscription',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject a pending subscription
     */
    public function reject(Request $request, Subscription $subscription)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if ($subscription->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending subscriptions can be rejected',
            ], 400);
        }

        try {
            $subscription->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
            ]);

            return response()->json([
                'message' => 'Subscription rejected successfully',
                'subscription' => [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'rejection_reason' => $subscription->rejection_reason,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject subscription',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * View payment receipt
     */
    public function getPaymentReceipt(Subscription $subscription)
    {
        if (!$subscription->payment_receipt_path) {
            return response()->json([
                'message' => 'No payment receipt found',
            ], 404);
        }

        return response()->json([
            'payment_receipt_url' => asset('storage/' . $subscription->payment_receipt_path),
        ]);
    }

    /**
     * Store owner submits payment proof to upgrade subscription
     */
    public function storeUpgrade(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'payment_receipt' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120', // 5MB max
        ]);

        try {
            $user = $request->user();

            // Get the store for this user
            $store = $user->store;
            if (!$store) {
                return response()->json([
                    'message' => 'Store not found for this user',
                ], 404);
            }

            // Upload the payment receipt
            $filePath = $request->file('payment_receipt')->store('subscriptions', 'public');

            // Get the old active/pending subscription before marking it as expired
            $oldSubscription = $store->subscriptions()
                ->whereIn('status', ['pending', 'active'])
                ->latest()
                ->first();

            // TERMINATE ALL OLD PROMOTIONS from the old subscription
            if ($oldSubscription) {
                // End all featured products from old subscription
                \App\Models\FeaturedProduct::where('subscription_code', $oldSubscription->subscription_code)
                    ->update(['is_active' => 0]);

                // End all hot deals from old subscription (set end time to now)
                \App\Models\HotDeal::where('subscription_code', $oldSubscription->subscription_code)
                    ->update(['deal_end_at' => now()]);
            }

            // Mark any existing pending/active subscriptions as expired
            $store->subscriptions()
                ->whereIn('status', ['pending', 'active'])
                ->update(['status' => 'expired']);

            // CREATE a new subscription entry (not update)
            // Each subscription purchase is a separate database record
            $subscription = Subscription::create([
                'store_id' => $store->id,
                'subscription_plan_id' => $request->plan_id,
                'payment_receipt_path' => $filePath,
                'status' => 'pending',
            ]);

            // Update the store's subscription field with the plan slug
            $plan = $subscription->plan;
            $store->update(['subscription' => $plan->slug]);

            return response()->json([
                'message' => 'Payment proof submitted successfully! Awaiting admin confirmation.',
                'subscription' => [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'plan_name' => $plan->name,
                    'subscription_code' => $subscription->subscription_code,
                    'payment_receipt_path' => $subscription->payment_receipt_path,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to submit payment proof',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get count of stores by subscription plan
     */
    public function storesByPlan(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $planColors = [
            'silver' => '#94a3b8',
            'gold' => '#f59e0b',
            'platinum' => '#a855f7',
        ];

        // Get count of active subscriptions grouped by plan
        $storesByPlan = Subscription::with('plan')
            ->where('status', 'active')
            ->get()
            ->groupBy('plan.slug')
            ->map(function ($group, $planSlug) use ($planColors) {
                $plan = $group->first()->plan;
                return [
                    'name' => $plan->name,
                    'value' => count($group),
                    'color' => $planColors[$planSlug] ?? '#888888',
                ];
            })
            ->values();

        return response()->json([
            'data' => $storesByPlan,
        ]);
    }
}
