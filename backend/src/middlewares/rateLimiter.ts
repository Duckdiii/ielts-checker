import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateLimitStore>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, store] of ipStore.entries()) {
    if (now > store.resetTime) {
      ipStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs?: number; // Time window in ms (e.g., 60,000 for 1 min)
  maxRequests?: number; // Max requests per window
  message?: string;
}

/**
 * Lightweight, zero-dependency in-memory rate limiting middleware
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.maxRequests || 60; // 60 requests/min default
  const message = options.message || 'Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau giây lát.';

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const routeKey = `${clientIp}:${req.baseUrl || req.path}`;
    let store = ipStore.get(routeKey);

    if (!store || now > store.resetTime) {
      store = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipStore.set(routeKey, store);
    } else {
      store.count += 1;
    }

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(store.resetTime / 1000));

    if (store.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: Math.ceil((store.resetTime - now) / 1000),
      });
    }

    next();
  };
}

// Preconfigured rate limiters for different endpoint sensitivities
export const standardApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100, // 100 requests per minute
});

export const heavyAiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30, // 30 AI evaluations/PDF parses per minute
  message: 'Bạn đang gửi yêu cầu AI quá nhanh. Vui lòng đợi vài giây trước khi tiếp tục.',
});
