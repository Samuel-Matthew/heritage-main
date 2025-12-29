<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class SellerRegistrationController extends Controller
{
    /**
     * Store seller registration and documents
     */
    public function store(Request $request)
    {
        // Get authenticated user
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Debug: Log incoming request
        \Log::info('Seller registration request:', [
            'user_id' => $user->id,
            'company_name' => $request->input('company_name'),
            'business_lines' => $request->input('business_lines'),
            'states' => $request->input('states'),
            'files' => array_keys($request->allFiles()),
        ]);

        // Validate basic information
        $validated = $request->validate([
            // Company Info
            'company_name' => 'required|string|max:255',
            'rc_number' => 'required|string|max:50|unique:stores,rc_number',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'address' => 'required|string',
            'contact_person' => 'required|string|max:255',

            // Business Details
            'business_lines' => 'required|array|min:1', 
            'business_lines.*' => 'string',
            'product_line' => 'required|string|min:3',
            'states' => 'required|array|min:1',
            'states.*' => 'string',

            // Documents
            'cac_certificate' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'company_logo' => 'required|file|mimes:jpg,jpeg,png|max:5120',
            'live_photos' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'tin_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'tax_clearance' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'dpr_nuprc' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'import_license' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'ncdmb' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'oem_partner' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'hse_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        try {
            DB::beginTransaction();

            // Check if user already has a store
            if ($user->store) {
                return response()->json([
                    'message' => 'You already have a seller account',
                    'errors' => ['general' => ['You can only create one seller account']],
                ], 422);
            }

            // Check if store with this rc_number already exists
            $existingStore = Store::where('rc_number', $validated['rc_number'])->first();
            if ($existingStore) {
                return response()->json([
                    'message' => 'This RC number is already registered',
                    'errors' => ['rc_number' => ['This RC number is already in use']],
                ], 422);
            }

            // Create store
            $store = Store::create([
                'user_id' => $user->id,
                'name' => $validated['company_name'],
                'description' => $validated['product_line'],
                'state' => implode(',', $validated['states']),
                'address' => $validated['address'],
                'phone' => $validated['phone'],
                'email' => $user->email,
                'status' => 'pending',
                'rc_number' => $validated['rc_number'],
                'business_lines' => implode(',', $validated['business_lines']),
                'contact_person' => $validated['contact_person'],
            ]);

            // Update user role to store_owner
            $user->update(['role' => 'store_owner']);

            // Upload mandatory documents
            $mandatoryDocs = ['cac_certificate', 'company_logo', 'live_photos'];
            foreach ($mandatoryDocs as $docType) {
                if ($request->hasFile($docType)) {
                    $this->uploadDocument($store, $docType, $request->file($docType), true);
                }
            }

            // Upload optional documents
            $optionalDocs = [
                'tin_certificate',
                'tax_clearance',
                'dpr_nuprc',
                'import_license',
                'ncdmb',
                'oem_partner',
                'hse_cert',
            ];
            foreach ($optionalDocs as $docType) {
                if ($request->hasFile($docType)) {
                    $this->uploadDocument($store, $docType, $request->file($docType), false);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Seller registration submitted successfully',
                'store_id' => $store->id,
                'user_id' => $user->id,
                'status' => 'pending',
                'role' => 'store_owner',
                'next_steps' => 'Your application will be reviewed within 24-48 hours. You now have access to the seller dashboard.',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Seller registration error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
                'errors' => ['general' => [$e->getMessage()]],
            ], 422);
        }
    }

    /**
     * Upload document helper
     */
    private function uploadDocument(Store $store, string $documentType, $file, bool $isMandatory)
    {
        $fileName = time() . '_' . $store->id . '_' . $documentType . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('store-documents/' . $store->id, $fileName, 'public');

        StoreDocument::create([
            'store_id' => $store->id,
            'type' => $documentType,
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'status' => 'pending',
            'is_mandatory' => $isMandatory,
        ]);
    }

    /**
     * Get registration status
     */
    public function status(Store $store)
    {
        $user = auth()->user();

        // Check if user owns this store
        if ($store->user_id !== $user->id && $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'id' => $store->id,
            'name' => $store->name,
            'status' => $store->status,
            'rejection_reason' => $store->rejection_reason,
            'approved_at' => $store->approved_at,
            'documents' => $store->documents()->select('type', 'status', 'file_path')->get(),
        ]);
    }
}
