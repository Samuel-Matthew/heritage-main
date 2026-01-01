<?php

namespace App\Http\Controllers\API\Admin;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    /**
     * Get all system settings
     */
    public function index()
    {
        try {
            // Cache settings permanently to avoid DB hits
            $setting = Cache::rememberForever('site_settings', function () {
                return SiteSetting::first() ?? SiteSetting::create([
                    'site_name' => 'My Site',
                    'site_title' => null,
                    'meta_description' => null,
                    'meta_keywords' => null,
                    'logo' => null,
                    'favicon' => null,
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $setting,
            ]);
        } catch (\Exception $e) {
            \Log::error('Settings fetch error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update system settings
     */
    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'site_name' => 'nullable|string|max:255',
                'site_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:1000',
                'meta_keywords' => 'nullable|string|max:1000',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'favicon' => 'nullable|image|mimes:jpeg,png,jpg,gif,ico|max:1024',
            ]);

            // Get or create the single site settings record
            $setting = SiteSetting::firstOrCreate([], [
                'site_name' => 'My Site',
            ]);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                if ($setting->logo) {
                    Storage::disk('public')->delete($setting->logo);
                }
                $validated['logo'] = $request->file('logo')->store('system/logos', 'public');
            }

            // Handle favicon upload
            if ($request->hasFile('favicon')) {
                if ($setting->favicon) {
                    Storage::disk('public')->delete($setting->favicon);
                }
                $validated['favicon'] = $request->file('favicon')->store('system/favicon', 'public');
            }

            // Update the settings
            $setting->update($validated);

            // Clear cache so next request gets fresh data
            Cache::forget('site_settings');

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
                'data' => $setting,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Settings update error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
