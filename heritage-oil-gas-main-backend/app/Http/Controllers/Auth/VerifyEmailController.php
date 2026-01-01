<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PendingUser;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VerifyEmailController extends Controller
{
    /**
     * Mark the user's email address as verified.
     * Moves user from pending_users to users table.
     */
    public function __invoke(Request $request): JsonResponse
    {
        // Get the ID from the route parameter
        $id = $request->route('id');
        $hash = $request->route('hash');

        \Log::info('Email verification attempt', ['id' => $id, 'hash' => $hash]);

        // Find pending user
        $pendingUser = PendingUser::find($id);

        if (!$pendingUser) {
            \Log::warning('Pending user not found', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification link',
            ], 400);
        }

        // Check if link has expired (10 minutes)
        if (Carbon::now()->isAfter($pendingUser->expires_at)) {
            \Log::warning('Verification link expired', ['id' => $id, 'email' => $pendingUser->email]);
            $pendingUser->delete();
            return response()->json([
                'success' => false,
                'message' => 'Verification link has expired. Please register again.',
            ], 400);
        }

        // Verify the hash matches
        if (sha1($pendingUser->email) !== $hash) {
            \Log::warning('Invalid verification hash', ['id' => $id, 'email' => $pendingUser->email]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification link',
            ], 400);
        }

        // Check if email already exists in users table
        if (User::where('email', $pendingUser->email)->exists()) {
            \Log::warning('Email already exists in users table', ['email' => $pendingUser->email]);
            $pendingUser->delete();
            return response()->json([
                'success' => false,
                'message' => 'This email has already been verified',
            ], 400);
        }

        // Move from pending_users to users table
        $user = User::create([
            'name' => $pendingUser->name,
            'email' => $pendingUser->email,
            'phone' => $pendingUser->phone,
            'password' => $pendingUser->password,
            'role' => $pendingUser->role,
            'email_verified_at' => Carbon::now(),
        ]);

        if (!$user) {
            \Log::error('Failed to create user from pending user', ['pending_id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete registration',
            ], 500);
        }

        // Delete pending user record
        $pendingUser->delete();

        // Fire verified event
        event(new Verified($user));

        \Log::info('Email verified and user created successfully', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully',
            'email' => $user->email,
        ]);
    }
}
