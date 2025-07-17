/**
 * Rate Limiting Middleware for Firebase Functions
 * Prevents API abuse and excessive usage
 */

// In-memory store for rate limiting (simple implementation)
const rateLimitStore = new Map();

/**
 * Clean up expired entries from rate limit store
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Create rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return (req, res, next) => {
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      cleanupExpiredEntries();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const resetTime = now + windowMs;

    // Get or create rate limit data for this key
    let rateLimitData = rateLimitStore.get(key);
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Create new rate limit window
      rateLimitData = {
        count: 0,
        resetTime: resetTime,
        firstRequest: now
      };
      rateLimitStore.set(key, rateLimitData);
    }

    // Increment request count
    rateLimitData.count++;

    // Set rate limit headers
    const remaining = Math.max(0, max - rateLimitData.count);
    const resetTimeSeconds = Math.ceil(rateLimitData.resetTime / 1000);
    
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTimeSeconds.toString(),
      'X-RateLimit-Window': Math.ceil(windowMs / 1000).toString()
    });

    // Check if rate limit exceeded
    if (rateLimitData.count > max) {
      const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
      
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfter,
        limit: max,
        windowMs: windowMs,
        timestamp: new Date().toISOString()
      });
    }

    // Continue to next middleware
    next();
  };
};

/**
 * Predefined rate limiters for different use cases
 */
const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  }),

  // Moderate rate limiting for API endpoints
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests. Please try again later.'
  }),

  // Lenient rate limiting for data operations
  data: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // 30 requests per 5 minutes
    message: 'Too many data requests. Please try again in a few minutes.'
  }),

  // Very strict rate limiting for sensitive operations
  sensitive: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many attempts for sensitive operation. Please try again in an hour.'
  })
};

/**
 * Apply rate limiting to Firebase Function
 */
const applyRateLimit = (rateLimiter) => {
  return (req, res, next) => {
    // Skip rate limiting for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    rateLimiter(req, res, next);
  };
};

/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
};

/**
 * Create user-based rate limiter (requires authentication)
 */
const createUserRateLimiter = (options = {}) => {
  return createRateLimiter({
    ...options,
    keyGenerator: (req) => {
      // Try to get user ID from JWT token or request
      const userId = req.user?.uid || req.userId || getClientIP(req);
      return `user:${userId}`;
    }
  });
};

module.exports = {
  createRateLimiter,
  rateLimiters,
  applyRateLimit,
  getClientIP,
  createUserRateLimiter
};