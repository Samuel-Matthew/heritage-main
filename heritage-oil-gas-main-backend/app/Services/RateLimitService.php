<?php

namespace App\Services;

use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;

class RateLimitService
{
    /**
     * Create a new instance.
     */
    public function __construct(private RateLimiter $limiter)
    {
    }

    /**
     * Check if request exceeds rate limit.
     */
    public function isLimited(Request $request, string $name, ?string $limit = null): bool
    {
        if ($this->isExcluded($request)) {
            return false;
        }

        $limit = $limit ?? config("ratelimit.limits.{$name}", '60,1');
        [$maxAttempts, $decayMinutes] = explode(',', $limit);

        $key = $this->key($request, $name);

        return $this->limiter->tooManyAttempts($key, (int) $maxAttempts);
    }

    /**
     * Record an attempt.
     */
    public function recordAttempt(Request $request, string $name, ?string $limit = null): void
    {
        $limit = $limit ?? config("ratelimit.limits.{$name}", '60,1');
        [$maxAttempts, $decayMinutes] = explode(',', $limit);

        $key = $this->key($request, $name);
        $this->limiter->hit($key, (int) $decayMinutes * 60);
    }

    /**
     * Get remaining requests.
     */
    public function remaining(Request $request, string $name, ?string $limit = null): int
    {
        $limit = $limit ?? config("ratelimit.limits.{$name}", '60,1');
        [$maxAttempts, $decayMinutes] = explode(',', $limit);

        $key = $this->key($request, $name);
        $attempts = $this->limiter->attempts($key);

        return max(0, (int) $maxAttempts - $attempts);
    }

    /**
     * Get retry after seconds.
     */
    public function retryAfter(Request $request, string $name): int
    {
        return $this->limiter->availableIn($this->key($request, $name));
    }

    /**
     * Clear rate limit for request.
     */
    public function clear(Request $request, string $name): void
    {
        $this->limiter->clear($this->key($request, $name));
    }

    /**
     * Check if request is excluded from rate limiting.
     */
    protected function isExcluded(Request $request): bool
    {
        $exceptions = config('ratelimit.exceptions.ips', []);
        return in_array($request->ip(), $exceptions);
    }

    /**
     * Generate rate limit key.
     */
    protected function key(Request $request, string $name): string
    {
        return "{$name}:{$request->ip()}";
    }
}
