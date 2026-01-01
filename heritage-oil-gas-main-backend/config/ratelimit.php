<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    | 
    | Configure rate limiting thresholds for different API endpoints.
    | Format: 'name' => 'max_requests,decay_minutes'
    |
    */

    'limits' => [
        // Authentication endpoints
        'login' => env('RATE_LIMIT_LOGIN', '5,1'),              // 5 attempts per minute
        'register' => env('RATE_LIMIT_REGISTER', '3,1'),        // 3 attempts per minute
        'forgot_password' => env('RATE_LIMIT_FORGOT', '3,1'),  // 3 attempts per minute

        // Email verification
        'verify_email' => env('RATE_LIMIT_VERIFY', '10,1'),    // 10 attempts per minute
        'verification_notification' => env('RATE_LIMIT_VERIFY_NOTIFY', '3,1'),

        // General API
        'api' => env('RATE_LIMIT_API', '60,1'),                 // 60 requests per minute
        'search' => env('RATE_LIMIT_SEARCH', '100,1'),         // 100 requests per minute
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Store for Rate Limiting
    |--------------------------------------------------------------------------
    | 
    | Specify which cache store to use for rate limiting.
    | Options: 'redis', 'database', 'memcached', 'file'
    |
    */

    'store' => env('RATE_LIMIT_STORE', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Rate Limit Exceptions
    |--------------------------------------------------------------------------
    | 
    | IP addresses that should be excluded from rate limiting.
    | Useful for development and testing.
    |
    */

    'exceptions' => [
        'ips' => explode(',', env('RATE_LIMIT_EXCEPTIONS', '')),
    ],
];
