<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreDocument;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    /**
     * Get the authenticated user's store and documents
     */
    public function myStore(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $store = Store::where('user_id', $user->id)->with(['activeSubscription.plan'])->first();

        if (!$store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $activeSubscription = $store->activeSubscription;
        $subscriptionData = null;

        if ($activeSubscription && $activeSubscription->plan) {
            // Check if subscription has expired and auto-expire it
            if ($activeSubscription->status === 'active' && $activeSubscription->ends_at && $activeSubscription->ends_at <= now()) {
                $activeSubscription->update([
                    'status' => 'expired',
                ]);
                $store->update([
                    'subscription' => 'basic',
                ]);

                // Suspend all products for this store when subscription expires
                $store->products()->update([
                    'status' => 'suspended',
                ]);
            }

            $subscriptionData = [
                'id' => $activeSubscription->id,
                'plan_id' => $activeSubscription->plan->id,
                'plan_name' => $activeSubscription->plan->slug,
                'plan_display_name' => $activeSubscription->plan->name,
                'product_limit' => $activeSubscription->plan->product_limit,
                'status' => $activeSubscription->status,
                'starts_at' => $activeSubscription->starts_at->format('Y-m-d'),
                'ends_at' => $activeSubscription->ends_at->format('Y-m-d'),
            ];
        }

        return response()->json([
            'id' => $store->id,
            'name' => $store->name,
            'owner' => $store->owner->name,
            'owner_email' => $store->owner->email,
            'email' => $store->email,
            'phone' => $store->phone,
            'alternatePhone' => $store->alternate_phone,
            'website' => $store->website,
            'address' => $store->address,
            'city' => $store->city,
            'state' => $store->state,
            'description' => $store->description,
            'openingHours' => $store->opening_hours,
            'status' => $store->status,
            'subscription' => $store->subscription,
            'active_subscription' => $subscriptionData,
            'rc_number' => $store->rc_number,
            'business_lines' => explode(',', $store->business_lines),
            'products_count' => $store->products()->count(),
            'documents' => $store->documents->map(fn($doc) => [
                'id' => $doc->id,
                'type' => $doc->type,
                'status' => $doc->status,
                'is_mandatory' => $doc->is_mandatory,
                'file_path' => $doc->file_path,
                'created_at' => $doc->created_at->format('Y-m-d'),
                'rejection_reason' => $doc->rejection_reason,
            ]),
            'created_at' => $store->created_at->format('Y-m-d'),
        ]);
    }

    /**
     * Update the authenticated user's store details
     */
    public function updateMyStore(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $store = Store::where('user_id', $user->id)->first();

        if (!$store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'alternatePhone' => 'nullable|string|max:20',
            'address' => 'sometimes|required|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'website' => 'nullable|url',
            'openingHours' => 'nullable|string|max:100',
        ]);

        // Map frontend field names to database field names
        $updateData = [];
        if (isset($validated['name']))
            $updateData['name'] = $validated['name'];
        if (isset($validated['email']))
            $updateData['email'] = $validated['email'];
        if (isset($validated['phone']))
            $updateData['phone'] = $validated['phone'];
        if (isset($validated['alternatePhone']))
            $updateData['alternate_phone'] = $validated['alternatePhone'];
        if (isset($validated['address']))
            $updateData['address'] = $validated['address'];
        if (isset($validated['city']))
            $updateData['city'] = $validated['city'];
        if (isset($validated['state']))
            $updateData['state'] = $validated['state'];
        if (isset($validated['description']))
            $updateData['description'] = $validated['description'];
        if (isset($validated['website']))
            $updateData['website'] = $validated['website'];
        if (isset($validated['openingHours']))
            $updateData['opening_hours'] = $validated['openingHours'];

        $store->update($updateData);

        return response()->json([
            'message' => 'Store updated successfully',
            'id' => $store->id,
            'name' => $store->name,
            'email' => $store->email,
            'phone' => $store->phone,
            'address' => $store->address,
            'state' => $store->state,
            'status' => $store->status,
        ]);
    }

    /**
     * Upload company logo for the store
     */
    public function uploadLogo(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $store = Store::where('user_id', $user->id)->first();

        if (!$store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        try {
            $validated = $request->validate([
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);

            // Delete old logo if exists
            $oldLogo = $store->documents()
                ->where(function ($query) {
                    $query->where('type', 'like', '%logo%')
                        ->orWhere('type', 'like', '%company%');
                })
                ->first();

            if ($oldLogo) {
                // Delete old file from storage
                if ($oldLogo->file_path && \Storage::disk('public')->exists($oldLogo->file_path)) {
                    \Storage::disk('public')->delete($oldLogo->file_path);
                }
                // Delete old document record
                $oldLogo->delete();
            }

            // Store new logo
            $logoPath = $request->file('logo')->store('documents/logos', 'public');

            if (!$logoPath) {
                return response()->json([
                    'message' => 'Failed to store file',
                ], 500);
            }

            // Create new document record
            $newDocument = StoreDocument::create([
                'store_id' => $store->id,
                'type' => 'company_logo',
                'file_path' => $logoPath,
                'mime_type' => $request->file('logo')->getMimeType(),
                'file_size' => $request->file('logo')->getSize(),
                'status' => 'approved',
                'is_mandatory' => false,
            ]);

            if (!$newDocument || !$newDocument->id) {
                return response()->json([
                    'message' => 'Failed to save logo to database',
                ], 500);
            }

            return response()->json([
                'message' => 'Logo uploaded successfully',
                'logo_path' => $logoPath,
                'document_id' => $newDocument->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('Logo upload error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to upload logo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
