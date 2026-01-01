<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class HandleRateLimitJson
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            return $next($request);
        } catch (TooManyRequestsHttpException $exception) {
            // Get retry-after header value
            $retryAfter = $exception->getHeaders()['Retry-After'] ?? 60;

            // Return JSON response for rate limit errors
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again in ' . $retryAfter . ' seconds.',
            ], 429, [
                'Retry-After' => $retryAfter,
                'X-RateLimit-Limit' => 'variable',
                'X-RateLimit-Remaining' => 0,
            ]);
        }
    }
}
