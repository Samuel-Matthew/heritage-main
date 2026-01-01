<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\API\PasswordResetController;
use Illuminate\Support\Facades\Route;

// Auth routes (automatically prefixed with /api when included in routes/api.php)
Route::post('register', [RegisteredUserController::class, 'store'])
    ->middleware(['guest', 'throttle:3,1'])
    ->name('register');

Route::post('check-email', [RegisteredUserController::class, 'checkEmail'])
    ->middleware('throttle:10,1')
    ->name('check-email');

Route::post('login', [AuthenticatedSessionController::class, 'store'])
    ->middleware(['guest', 'throttle:5,1'])
    ->name('login');

Route::get('user', [AuthenticatedSessionController::class, 'getUser'])
    ->middleware('auth:web')
    ->name('user');

Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware(['guest', 'throttle:3,1'])
    ->name('password.email');

Route::post('reset-password', [NewPasswordController::class, 'store'])
    ->middleware(['guest', 'throttle:3,1'])
    ->name('password.store');

Route::post('verify-reset-token', [PasswordResetController::class, 'verifyToken'])
    ->middleware(['guest', 'throttle:10,1'])
    ->name('password.verify-token');

Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
    ->middleware('throttle:10,1')
    ->name('verification.verify');

Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
    ->middleware(['auth', 'throttle:3,1'])
    ->name('verification.send');

Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');
