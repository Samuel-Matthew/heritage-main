<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    /**
     * Get all stores with pagination and filters
     */
    public function index(Request $request)
    {
        $query = Store::with('owner')
            ->select('stores.*');

        // Search by name or owner email
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('owner', function ($u) use ($search) {
                        $u->where('email', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status
        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // Filter by state
        if ($request->has('state') && $request->input('state') !== 'all') {
            $query->where('state', 'like', '%' . $request->input('state') . '%');
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $stores = $query->orderBy('created_at', 'asc')->paginate($perPage);

        return response()->json([
            'data' => $stores->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'owner' => $store->owner->name,
                    'email' => $store->email,
                    'state' => $store->state,
                    'status' => $store->status,
                    'products' => $store->products()->count(),
                    'subscription' => $store->subscriptions()->latest()->first()?->plan?->name ?? 'Basic',
                    'createdAt' => $store->created_at->format('Y-m-d'),
                    'phone' => $store->phone,
                    'address' => $store->address,
                    'rc_number' => $store->rc_number,
                ];
            }),
            'pagination' => [
                'total' => $stores->total(),
                'per_page' => $stores->perPage(),
                'current_page' => $stores->currentPage(),
                'last_page' => $stores->lastPage(),
                'from' => $stores->firstItem(),
                'to' => $stores->lastItem(),
            ],
        ]);
    }

    /**
     * Get single store details
     */
    public function show(Store $store)
    {
        return response()->json([
            'id' => $store->id,
            'name' => $store->name,
            'owner' => $store->owner->name,
            'owner_email' => $store->owner->email,
            'email' => $store->email,
            'phone' => $store->phone,
            'address' => $store->address,
            'state' => $store->state,
            'status' => $store->status,
            'rc_number' => $store->rc_number,
            'business_lines' => explode(',', $store->business_lines),
            'products_count' => $store->products()->count(),
            'documents' => $store->documents->map(fn($doc) => [
                'id' => $doc->id,
                'type' => $doc->type,
                'status' => $doc->status,
                'is_mandatory' => $doc->is_mandatory,
                'file_path' => $doc->file_path,
            ]),
            'created_at' => $store->created_at->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Approve a store
     */
    public function approve(Request $request, Store $store)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            // Check if all documents are approved
            $pendingDocuments = $store->documents()
                ->where('status', '!=', 'approved')
                ->count();

            if ($pendingDocuments > 0) {
                return response()->json([
                    'message' => 'All documents must be approved before approving the store',
                    'pending_documents' => $pendingDocuments,
                ], 422);
            }

            $store->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            return response()->json([
                'message' => 'Store approved successfully',
                'store' => $store,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve store',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject a store with reason
     */
    public function reject(Request $request, Store $store)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'rejection_reason' => 'required|string|max:500',
            ]);

            $store->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['rejection_reason'],
            ]);

            return response()->json([
                'message' => 'Store rejected successfully',
                'store' => $store,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject store',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Suspend a store
     */
    public function suspend(Request $request, Store $store)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $store->update([
                'status' => 'suspended',
                'suspension_reason' => $validated['reason'],
            ]);

            return response()->json([
                'message' => 'Store suspended successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to suspend store',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
