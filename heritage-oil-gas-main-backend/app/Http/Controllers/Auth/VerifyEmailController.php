<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    /**
     * Mark the user's email address as verified.
     */
    public function __invoke(Request $request): JsonResponse
    {
        // Get the ID from the route parameter
        $id = $request->route('id');
        $hash = $request->route('hash');

        // Find the user
        $user = User::findOrFail($id);

        // Verify the hash matches
        if (sha1($user->getEmailForVerification()) !== $hash) {
            \Log::warning('Invalid verification hash for user ' . $user->id);
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification link',
            ], 400);
        }

        // Check if already verified
        if ($user->hasVerifiedEmail()) {
            \Log::info('User ' . $user->id . ' email already verified');
            return response()->json([
                'success' => true,
                'message' => 'Email already verified',
                'email' => $user->email,
            ]);
        }

        // Mark email as verified
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
            \Log::info('Email verified for user ' . $user->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully',
            'email' => $user->email,
        ]);
    }
}
