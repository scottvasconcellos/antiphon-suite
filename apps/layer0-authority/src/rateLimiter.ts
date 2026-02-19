import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate limiting configuration for API endpoints.
 */

const REDEEM_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_REDEEM_PER_HOUR || "5", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "3600000", 10);

/**
 * Rate limiter for serial redemption endpoint.
 * Limits to 5 attempts per user per hour by default.
 */
export const redeemRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: REDEEM_LIMIT_PER_HOUR,
  message: {
    error: "Too many redemption attempts",
    message: `Maximum ${REDEEM_LIMIT_PER_HOUR} redemption attempts per hour. Please try again later.`
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key generator: use user_id from session if available, otherwise IP
  keyGenerator: (req: Request): string => {
    // Try to get user_id from session (if auth middleware has run)
    const session = (req as any).session;
    if (session?.userId) {
      return `redeem:user:${session.userId}`;
    }
    // Fallback to IP address
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `redeem:ip:${ip}`;
  },
  // Skip rate limiting for webhooks (they have their own rate control)
  skip: (req: Request) => {
    return req.path.startsWith("/webhooks/");
  }
});

/**
 * Rate limiter for general API endpoints (auth, etc.)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false
});
