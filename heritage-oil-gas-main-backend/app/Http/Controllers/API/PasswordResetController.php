<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /**
     * Verify if a reset token is valid
     */
    public function verifyToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        try {
            // Check if token exists and is not expired in password_resets table
            $resetRecord = \DB::table('password_resets')
                ->where('email', $request->email)
                ->where('token', hash('sha256', $request->token))
                ->first();

            if (!$resetRecord) {
                throw ValidationException::withMessages([
                    'token' => ['This password reset link is invalid or has expired.'],
                ]);
            }

            // Check if token is expired (older than 60 minutes)
            if (\Carbon\Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
                throw ValidationException::withMessages([
                    'token' => ['This password reset link has expired.'],
                ]);
            }

            return response()->json([
                'valid' => true,
                'message' => 'Token is valid',
            ]);
        } catch (\Exception $e) {
            if ($e instanceof ValidationException) {
                throw $e;
            }

            throw ValidationException::withMessages([
                'token' => ['Unable to verify reset token.'],
            ]);
        }
    }
}
