<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    /**
     * Get all subscription plans
     */
    public function index()
    {
        $plans = SubscriptionPlan::all();

        return response()->json([
            'data' => $plans->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'product_limit' => $plan->product_limit,
                    'bank_account_name' => $plan->bank_account_name,
                    'bank_account_number' => $plan->bank_account_number,
                    'bank_name' => $plan->bank_name,
                    'is_active' => $plan->is_active,
                ];
            }),
        ]);
    }

    /**
     * Get subscription plan details
     */
    public function show(SubscriptionPlan $plan)
    {
        return response()->json([
            'id' => $plan->id,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'description' => $plan->description,
            'price' => $plan->price,
            'product_limit' => $plan->product_limit,
            'bank_account_name' => $plan->bank_account_name,
            'bank_account_number' => $plan->bank_account_number,
            'bank_name' => $plan->bank_name,
            'is_active' => $plan->is_active,
        ]);
    }

    /**
     * Update subscription plan
     */
    public function update(Request $request, SubscriptionPlan $plan)
    {
        if (auth()->check() && auth()->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|unique:subscription_plans,name,' . $plan->id,
            'price' => 'sometimes|numeric|min:0',
            'product_limit' => 'sometimes|integer|min:0',
            'bank_account_name' => 'sometimes|string|nullable',
            'bank_account_number' => 'sometimes|string|nullable',
            'bank_name' => 'sometimes|string|nullable',
            'description' => 'sometimes|string|nullable',
            'is_active' => 'sometimes|boolean',
        ]);

        try {
            $plan->update($validated);

            return response()->json([
                'message' => 'Subscription plan updated successfully',
                'data' => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'price' => $plan->price,
                    'product_limit' => $plan->product_limit,
                    'bank_account_name' => $plan->bank_account_name,
                    'bank_account_number' => $plan->bank_account_number,
                    'bank_name' => $plan->bank_name,
                    'is_active' => $plan->is_active,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update subscription plan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
