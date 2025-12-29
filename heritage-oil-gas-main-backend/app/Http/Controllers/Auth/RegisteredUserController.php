<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): Response|JsonResponse
    {
        try {
            \Log::info('Registration attempt started', [
                'email' => $request->input('email'),
                'name' => $request->input('name'),
            ]);

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
                'phone' => ['nullable', 'string', 'max:20'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            \Log::info('Validation passed', ['email' => $validated['email']]);

            // Check if user already exists
            $existingUser = User::where('email', $validated['email'])->first();
            if ($existingUser) {
                \Log::warning('User already exists', ['email' => $validated['email']]);
                return response()->json([
                    'message' => 'The email has already been registered.',
                    'errors' => ['email' => ['The email has already been registered.']]
                ], 422);
            }

            \Log::info('Creating user with data', [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? 'null'
            ]);

            // Use validated data, not raw request
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
            ]);

            \Log::info('User model returned', [
                'user_id' => $user?->id,
                'user_email' => $user?->email,
                'is_null' => is_null($user)
            ]);

            if (!$user) {
                \Log::error('User::create() returned null');
                return response()->json([
                    'message' => 'Failed to create user - create returned null',
                    'errors' => ['general' => ['User creation failed']]
                ], 500);
            }

            // Verify user was actually saved
            $verifyUser = User::find($user->id);
            \Log::info('Verifying saved user', [
                'found' => !is_null($verifyUser),
                'user_id' => $user->id
            ]);

            if (!$verifyUser) {
                \Log::error('User was not found in database after create', ['id' => $user->id]);
                return response()->json([
                    'message' => 'User creation may have failed - could not verify in database',
                    'errors' => ['general' => ['User not found after creation']]
                ], 500);
            }

            \Log::info('User successfully created and verified', [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name
            ]);

            // Dispatch the Registered event to send verification email
            \Log::info('Dispatching Registered event to send verification email', [
                'email' => $user->email,
                'user_id' => $user->id
            ]);
            event(new Registered($user));
            \Log::info('Verification email dispatched successfully');

            \Log::info('Registered event dispatched - verification email queued');

            // Return success without logging in the user
            // User must verify email first
            return response()->json([
                'message' => 'Registration successful! Please check your email to verify your account.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at,
                ]
            ], 200)->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Validation exception', ['errors' => $e->errors()]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Registration error - exception caught', [
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
     * Check if an email already exists in the database
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower($request->email);
        $exists = User::where('email', $email)->exists();

        return response()->json([
            'exists' => $exists,
            'message' => $exists ? 'Email already registered' : 'Email is available'
        ]);
    }

}
