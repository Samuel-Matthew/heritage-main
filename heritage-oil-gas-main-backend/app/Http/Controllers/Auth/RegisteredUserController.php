<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PendingUser;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\Rules;
use Carbon\Carbon;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     * Saves user to pending_users table until email is verified.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): Response|JsonResponse
    {
        try {
            Log::info('Registration attempt started', [
                'email' => $request->input('email'),
                'name' => $request->input('name'),
            ]);

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
                'phone' => ['nullable', 'string', 'max:20'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            Log::info('Validation passed', ['email' => $validated['email']]);

            // Check if user already exists in users table
            $existingUser = User::where('email', $validated['email'])->first();
            if ($existingUser) {
                Log::warning('User already exists', ['email' => $validated['email']]);
                return response()->json([
                    'message' => 'The email has already been registered.',
                    'errors' => ['email' => ['The email has already been registered.']]
                ], 422);
            }

            // Check if user already exists in pending_users table
            $pendingUserExists = PendingUser::where('email', $validated['email'])->first();
            if ($pendingUserExists) {
                Log::warning('Pending user already exists', ['email' => $validated['email']]);
                return response()->json([
                    'message' => 'This email is already pending verification. Please check your email for the verification link.',
                    'errors' => ['email' => ['Email already pending verification']]
                ], 422);
            }

            Log::info('Saving pending user registration', [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? 'null'
            ]);

            // Save to pending_users table with 60 minute expiration
            $pendingUser = PendingUser::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'buyer',
                'expires_at' => Carbon::now()->addMinutes(10),
            ]);

            Log::info('Pending user created successfully', [
                'id' => $pendingUser->id,
                'email' => $pendingUser->email,
            ]);

            // Send verification email
            Log::info('Sending verification email', [
                'email' => $pendingUser->email,
            ]);

            // Send the email notification directly using the PendingUser model
            try {
                $pendingUser->notify(new VerifyEmailNotification());
                Log::info('Verification email sent successfully', [
                    'email' => $pendingUser->email,
                ]);
            } catch (\Exception $emailException) {
                Log::error('Failed to send verification email', [
                    'email' => $pendingUser->email,
                    'error' => $emailException->getMessage(),
                    'trace' => $emailException->getTraceAsString(),
                ]);
                // Don't fail registration if email fails - user can request resend
            }

            // Return success without logging in the user
            // User must verify email first
            return response()->json([
                'message' => 'Registration successful! Please check your email to verify your account.',
                'user' => [
                    'email' => $pendingUser->email,
                    'name' => $pendingUser->name,
                    'phone' => $pendingUser->phone,
                    'role' => $pendingUser->role,
                ]
            ], 200)->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation exception', ['errors' => $e->errors()]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Registration error - exception caught', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'message' => 'An error occurred during registration: ' . $e->getMessage(),
                'errors' => ['general' => [$e->getMessage()]],
                'exception_class' => get_class($e)
            ], 500);
        }
    }

    /**
     * Check if an email already exists in the database or pending registrations
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower($request->email);

        // Check both users and pending_users tables
        $exists = User::where('email', $email)->exists() ||
            PendingUser::where('email', $email)->exists();

        return response()->json([
            'exists' => $exists,
            'message' => $exists ? 'Email already registered' : 'Email is available'
        ]);
    }

}
