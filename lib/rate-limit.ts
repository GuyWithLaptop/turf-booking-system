import { NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar distributed cache
 */
export function rateLimit(config: RateLimitConfig) {
  return {
    check: (identifier: string): { success: boolean; remaining: number } => {
      const now = Date.now();
      const key = identifier;

      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 1,
          resetTime: now + config.interval,
        };
        return { success: true, remaining: config.uniqueTokenPerInterval - 1 };
      }

      store[key].count += 1;

      const success = store[key].count <= config.uniqueTokenPerInterval;
      const remaining = Math.max(0, config.uniqueTokenPerInterval - store[key].count);

      return { success, remaining };
    },
  };
}

/**
 * Get rate limit identifier from request
 * Uses IP address or user ID
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  
  if (realIp) {
    return `ip:${realIp}`;
  }

  return 'ip:unknown';
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(retryAfter: number = 60) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  );
}
