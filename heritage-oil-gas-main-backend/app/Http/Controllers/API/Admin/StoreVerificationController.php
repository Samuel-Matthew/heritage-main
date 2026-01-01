<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Notifications\StoreVerificationNotification;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StoreVerificationController extends Controller
{
    /**
     * Approve a store application
     */
    public function approve(Request $request, Store $store)
    {
        // Check if user is admin
        if (auth()->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        try {
            // Update store status
            $store->update([
                'status' => 'approved',
                'approved_at' => Carbon::now(),
            ]);

            // Send approval notification to store owner
            $store->owner->notify(new StoreVerificationNotification($store, true));

            \Log::info('Store approved by admin', [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'admin_id' => auth()->user()->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'message' => 'Store approved successfully',
                'store' => [
                    'id' => $store->id,
                    'name' => $store->name,
                    'status' => $store->status,
                    'approved_at' => $store->approved_at,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error approving store:', [
                'store_id' => $store->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to approve store',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject a store application
     */
    public function reject(Request $request, Store $store)
    {
        // Check if user is admin
        if (auth()->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'reason' => 'required|string|min:10',
        ]);

        try {
            // Update store status
            $store->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['reason'],
            ]);

            // Send rejection notification to store owner
            $store->owner->notify(new StoreVerificationNotification($store, false));

            \Log::info('Store rejected by admin', [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'admin_id' => auth()->user()->id,
                'reason' => $validated['reason'],
            ]);

            return response()->json([
                'message' => 'Store rejected successfully',
                'store' => [
                    'id' => $store->id,
                    'name' => $store->name,
                    'status' => $store->status,
                    'rejection_reason' => $store->rejection_reason,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error rejecting store:', [
                'store_id' => $store->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to reject store',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pending stores for review
     */
    public function pending()
    {
        // Check if user is admin
        if (auth()->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $pendingStores = Store::where('status', 'pending')
                ->with(['owner:id,name,email', 'documents:id,store_id,type,status'])
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'message' => 'Pending stores retrieved successfully',
                'count' => $pendingStores->count(),
                'stores' => $pendingStores,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching pending stores:', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch pending stores',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get store details for admin review
     */
    public function show(Store $store)
    {
        // Check if user is admin
        if (auth()->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $storeData = $store->load([
                'owner:id,name,email,phone,created_at',
                'documents' => function ($query) {
                    $query->select('id', 'store_id', 'type', 'status', 'file_path', 'created_at');
                },
            ]);

            return response()->json([
                'message' => 'Store details retrieved successfully',
                'store' => $storeData,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching store details:', [
                'store_id' => $store->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch store details',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
