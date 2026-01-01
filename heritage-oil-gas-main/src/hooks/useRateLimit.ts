import { useState, useCallback, useEffect } from 'react';

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
  message: string;
}

/**
 * Custom hook for managing rate limit state in components
 * 
 * Usage:
 * const { isLimited, countdown, handleRateLimitError, resetRateLimit } = useRateLimit();
 * 
 * Then in error handler:
 * if (error.response?.status === 429) {
 *   const retryAfter = error.retryAfter || 60;
 *   handleRateLimitError(retryAfter, error.message);
 * }
 */
export const useRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    retryAfter: 0,
    message: '',
  });

  const [countdown, setCountdown] = useState(0);

  /**
   * Handle a rate limit error - sets state and starts countdown timer
   */
  const handleRateLimitError = useCallback((retryAfter: number, message: string) => {
    setRateLimitState({
      isLimited: true,
      retryAfter,
      message,
    });

    setCountdown(retryAfter);
  }, []);

  /**
   * Clear rate limit state (call this to reset)
   */
  const resetRateLimit = useCallback(() => {
    setRateLimitState({
      isLimited: false,
      retryAfter: 0,
      message: '',
    });
    setCountdown(0);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!rateLimitState.isLimited || countdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Timer finished, clear rate limit
          resetRateLimit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitState.isLimited, countdown, resetRateLimit]);

  return {
    isLimited: rateLimitState.isLimited,
    retryAfter: rateLimitState.retryAfter,
    message: rateLimitState.message,
    countdown,
    handleRateLimitError,
    resetRateLimit,
  };
};
