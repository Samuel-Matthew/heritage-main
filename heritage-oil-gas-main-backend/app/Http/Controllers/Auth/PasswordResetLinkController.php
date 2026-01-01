<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PasswordResetLinkController extends Controller
{
    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        Log::info('[FORGOT PASSWORD] Request received', ['email' => $request->email]);

        // We will send the password reset link to this user. Once we have attempted
        // to send the link, we will examine the response then see the message we
        // need to show to the user. Finally, we'll send out a proper response.
        try {
            $status = Password::sendResetLink(
                $request->only('email')
            );

            Log::info('[FORGOT PASSWORD] Status returned', ['email' => $request->email, 'status' => $status]);

            if ($status != Password::RESET_LINK_SENT) {
                Log::error('[FORGOT PASSWORD] Reset link not sent', ['email' => $request->email, 'status' => $status]);
                throw ValidationException::withMessages([
                    'email' => [__($status)],
                ]);
            }

            Log::info('[FORGOT PASSWORD] Email sent successfully', ['email' => $request->email]);
            return response()->json(['status' => __($status)]);
        } catch (\Exception $e) {
            Log::error('[FORGOT PASSWORD] Exception occurred', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
