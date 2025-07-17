# Critical Security Fixes - Design Document

## Overview

This design document outlines the technical approach to resolve critical security vulnerabilities in the MarLang News App. The focus is on hardening JWT token security, preventing XSS attacks, fixing memory leaks, improving error handling, and implementing API rate limiting.

## Architecture

### Security Architecture Changes

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                         │
├─────────────────────────────────────────────────────────────┤
│  ❌ localStorage (REMOVE)                                   │
│  ✅ HttpOnly Cookies (NEW)                                  │
│  ✅ Secure Headers (ENHANCED)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS Only
                              │
┌─────────────────────────────────────────────────────────────┐
│                Firebase Functions (Server)                  │
├─────────────────────────────────────────────────────────────┤
│  ✅ Environment-only JWT Secrets                            │
│  ✅ Rate Limiting Middleware                                │
│  ✅ Enhanced Error Handling                                 │
│  ✅ Token Validation & Refresh                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. JWT Security Hardening

#### Enhanced JWT Service
```javascript
// functions/services/jwtService.js
class JWTService {
  constructor() {
    this.secret = this.validateSecret();
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
  }

  validateSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    return secret;
  }

  generateTokens(payload) {
    // Implementation with secure token generation
  }

  verifyToken(token, type = 'access') {
    // Implementation with proper validation
  }
}
```

#### Environment Validation
```javascript
// functions/utils/envValidator.js
const validateEnvironment = () => {
  const required = ['JWT_SECRET', 'NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
```

### 2. XSS Protection via Secure Token Storage

#### Secure Cookie Manager
```javascript
// functions/utils/cookieManager.js
class CookieManager {
  static setSecureCookie(res, name, value, options = {}) {
    const defaultOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      ...options
    };
    
    res.cookie(name, value, defaultOptions);
  }

  static clearSecureCookie(res, name) {
    res.clearCookie(name, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
  }
}
```

#### Client-side Token Migration
```javascript
// src/utils/tokenMigration.js
export const migrateTokensToSecure = async () => {
  // Check for old localStorage tokens
  const oldToken = localStorage.getItem('naverAuthUser');
  
  if (oldToken) {
    try {
      // Validate with server and migrate to HttpOnly cookies
      await fetch('/api/migrate-tokens', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ oldToken })
      });
      
      // Clear old storage
      localStorage.removeItem('naverAuthUser');
    } catch (error) {
      console.error('Token migration failed:', error);
    }
  }
};
```

### 3. Memory Leak Prevention

#### Enhanced Cleanup Hooks
```javascript
// src/hooks/useCleanup.js
export const useCleanup = (cleanupFn) => {
  const cleanupRef = useRef(cleanupFn);
  
  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);
  
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
};
```

#### Event Listener Manager
```javascript
// src/utils/eventManager.js
class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(element, event, handler, options) {
    const key = `${element}-${event}`;
    
    // Remove existing listener if any
    this.removeEventListener(key);
    
    element.addEventListener(event, handler, options);
    this.listeners.set(key, { element, event, handler, options });
  }

  removeEventListener(key) {
    const listener = this.listeners.get(key);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler);
      this.listeners.delete(key);
    }
  }

  cleanup() {
    this.listeners.forEach((listener, key) => {
      this.removeEventListener(key);
    });
  }
}
```

### 4. API Rate Limiting

#### Rate Limiting Middleware
```javascript
// functions/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use Redis for distributed rate limiting
    store: new RedisStore({
      // Redis connection options
    })
  });
};
```

### 5. Enhanced Error Handling

#### Global Error Handler
```javascript
// functions/middleware/errorHandler.js
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Security: Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };

  // Log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to error monitoring service
  }

  res.status(error.status || 500).json(errorResponse);
};
```

## Data Models

### Secure Token Model
```javascript
// Token structure for HttpOnly cookies
{
  accessToken: {
    value: 'jwt_token_string',
    expires: Date,
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  },
  refreshToken: {
    value: 'refresh_token_string',
    expires: Date,
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
}
```

### Rate Limit Model
```javascript
// Rate limiting data structure
{
  key: 'ip:user_id',
  count: number,
  resetTime: timestamp,
  blocked: boolean
}
```

## Error Handling

### Client-side Error Boundaries
- Enhanced error boundaries with security-aware error reporting
- Sanitized error messages for production
- Automatic error recovery mechanisms

### Server-side Error Handling
- Comprehensive error logging
- Security-focused error responses
- Rate limiting for error endpoints

## Testing Strategy

### Security Testing
1. **JWT Security Tests**
   - Test token generation with various secret lengths
   - Verify token expiration handling
   - Test refresh token rotation

2. **XSS Protection Tests**
   - Verify tokens are not accessible via JavaScript
   - Test cookie security flags
   - Validate token migration process

3. **Rate Limiting Tests**
   - Test rate limit enforcement
   - Verify proper error responses
   - Test distributed rate limiting

### Performance Testing
1. **Memory Leak Tests**
   - Long-running session tests
   - Component mount/unmount cycles
   - Event listener cleanup verification

2. **Load Testing**
   - API endpoint stress testing
   - Rate limiting under load
   - Error handling under stress

### Integration Testing
1. **Authentication Flow Tests**
   - End-to-end login/logout flows
   - Token refresh scenarios
   - Cross-browser compatibility

2. **Security Integration Tests**
   - HTTPS enforcement
   - Cookie security validation
   - CORS policy verification