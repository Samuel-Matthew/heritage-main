<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\StoreDocument;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    /**
     * Approve a document
     */
    public function approve(Request $request, StoreDocument $document)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $document->update([
                'status' => 'approved',
            ]);

            return response()->json([
                'message' => 'Document approved successfully',
                'document' => $document,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject a document with reason
     */
    public function reject(Request $request, StoreDocument $document)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $document->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['reason'],
            ]);

            return response()->json([
                'message' => 'Document rejected successfully',
                'document' => $document,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
