<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StoreReportController extends Controller
{
    /**
     * Submit a report for a store
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Only authenticated users can report
        if (!$user) {
            return response()->json([
                'message' => 'You must be logged in to report a store',
            ], 401);
        }

        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
            'reason' => 'required|in:inappropriate_content,fraudulent_activity,poor_quality,fake_products,misleading_information,unprofessional_behavior,scam,other',
            'description' => 'nullable|string|max:1000',
        ]);

        try {
            // Check if user already reported this store
            $existingReport = StoreReport::where('store_id', $validated['store_id'])
                ->where('reported_by', $user->id)
                ->first();

            if ($existingReport) {
                return response()->json([
                    'message' => 'You have already reported this store',
                ], 422);
            }

            // Create report
            $report = StoreReport::create([
                'store_id' => $validated['store_id'],
                'reported_by' => $user->id,
                'reason' => $validated['reason'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
            ]);

            Log::info('Store reported by user', [
                'store_id' => $validated['store_id'],
                'reported_by' => $user->id,
                'reason' => $validated['reason'],
                'report_id' => $report->id,
            ]);

            return response()->json([
                'message' => 'Thank you for reporting this store. Our team will review it shortly.',
                'report_id' => $report->id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating store report', [
                'error' => $e->getMessage(),
                'store_id' => $validated['store_id'] ?? null,
            ]);

            return response()->json([
                'message' => 'Failed to submit report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all reports (admin only)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Check if user is admin
        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $query = StoreReport::with(['store', 'reporter']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        // Format the reports to include store_name and reporter name
        $reports->getCollection()->transform(function ($report) {
            return [
                'id' => $report->id,
                'store_id' => $report->store_id,
                'store_name' => $report->store->name ?? 'Unknown Store',
                'reported_by' => $report->reporter->name ?? 'Unknown User',
                'reporter_email' => $report->reporter->email ?? 'N/A',
                'reason' => $report->reason,
                'description' => $report->description,
                'status' => $report->status,
                'admin_notes' => $report->admin_notes,
                'created_at' => $report->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json($reports);
    }

    /**
     * Get a specific report (admin only)
     */
    public function show(Request $request, StoreReport $report)
    {
        $user = $request->user();

        // Check if user is admin
        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'id' => $report->id,
            'store_id' => $report->store_id,
            'store_name' => $report->store->name,
            'reported_by' => $report->reporter->name,
            'reporter_email' => $report->reporter->email,
            'reason' => $report->reason,
            'description' => $report->description,
            'status' => $report->status,
            'admin_notes' => $report->admin_notes,
            'created_at' => $report->created_at->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Update report status (admin only)
     */
    public function updateStatus(Request $request, StoreReport $report)
    {
        $user = $request->user();

        // Check if user is admin
        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,reviewed,resolved,dismissed',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $report->update([
            'status' => $validated['status'],
            'admin_notes' => $validated['admin_notes'] ?? $report->admin_notes,
        ]);

        return response()->json([
            'message' => 'Report updated successfully',
            'report' => [
                'id' => $report->id,
                'status' => $report->status,
                'admin_notes' => $report->admin_notes,
            ],
        ]);
    }
}
