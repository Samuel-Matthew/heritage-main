<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class RateLimitByIp
{
    /**
     * Create a new rate limiter instance.
     */
    public function __construct(private RateLimiter $limiter)
    {
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $limit = '60,1'): SymfonyResponse
    {
        // Parse the limit (e.g., "60,1" means 60 requests per 1 minute)
        [$maxAttempts, $decayMinutes] = explode(',', $limit);

        $key = $this->resolveRequestSignature($request);

        if ($this->limiter->tooManyAttempts($key, (int) $maxAttempts)) {
            return $this->buildResponse($request, (int) $maxAttempts);
        }

        $this->limiter->hit($key, (int) $decayMinutes * 60);

        $response = $next($request);

        return $this->addHeaders(
            $response,
            (int) $maxAttempts,
            (int) $this->limiter->attempts($key),
            (int) $this->limiter->availableIn($key)
        );
    }

    /**
     * Resolve request signature for rate limiting.
     */
    protected function resolveRequestSignature(Request $request): string
    {
        $ip = $request->ip();
        $route = $request->route()?->getName() ?? 'unknown';

        return "{$route}:{$ip}";
    }

    /**
     * Create a response indicating the rate limit has been exceeded.
     */
    protected function buildResponse(Request $request, int $limit): Response
    {
        $retryAfter = $this->limiter->availableIn(
            $this->resolveRequestSignature($request)
        );

        return response()->json([
            'success' => false,
            'message' => "Too many requests. Please try again in {$retryAfter} seconds.",
            'retry_after' => $retryAfter,
        ], 429)->header('Retry-After', $retryAfter);
    }

    /**
     * Add rate limit headers to the response.
     */
    protected function addHeaders(
        SymfonyResponse $response,
        int $limit,
        int $current,
        int $remainingSeconds
    ): SymfonyResponse {
        return $response
            ->header('X-RateLimit-Limit', $limit)
            ->header('X-RateLimit-Remaining', max(0, $limit - $current))
            ->header('X-RateLimit-Reset', now()->addSeconds($remainingSeconds)->timestamp);
    }
}
