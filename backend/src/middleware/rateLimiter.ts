import rateLimit from 'express-rate-limit';

// Assignment specifications:
// 1. Auth endpoints: Rate limit login/registration brute-force attempts
// In development allow 100 attempts, in production allow 15; skip successful requests so legitimate users aren't locked out.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// 2. Transaction endpoints: 100 requests per hour
export const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Transaction rate limit exceeded (100 requests per hour). Please try again later.',
  },
});

// 3. Analytics endpoints: 50 requests per hour
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Analytics rate limit exceeded (50 requests per hour). Please try again later.',
  },
});
