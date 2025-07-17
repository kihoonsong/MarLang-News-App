/**
 * Global Error Handler Middleware
 * Provides secure error handling that doesn't expose sensitive information
 */

const errorHandler = (error, req, res, next) => {
  // Log error details for debugging (server-side only)
  console.error('🚨 Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  });

  // Determine if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Create safe error response
  const errorResponse = {
    success: false,
    timestamp: new Date().toISOString(),
    requestId: req.id || generateRequestId()
  };

  // Add error details based on environment
  if (isDevelopment) {
    // In development, provide detailed error information
    errorResponse.error = error.message;
    errorResponse.stack = error.stack;
    errorResponse.details = {
      name: error.name,
      code: error.code
    };
  } else {
    // In production, provide generic error messages
    errorResponse.error = getGenericErrorMessage(error);
  }

  // Determine HTTP status code
  const statusCode = getStatusCode(error);
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Generate a unique request ID for tracking
 */
const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Get generic error message based on error type
 */
const getGenericErrorMessage = (error) => {
  // Map specific errors to user-friendly messages
  if (error.code === 'auth/invalid-token') {
    return 'Authentication failed. Please log in again.';
  }
  
  if (error.code === 'permission-denied') {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.message && error.message.includes('JWT')) {
    return 'Authentication error. Please log in again.';
  }
  
  if (error.message && error.message.includes('rate limit')) {
    return 'Too many requests. Please try again later.';
  }
  
  // Default generic message
  return 'An internal error occurred. Please try again later.';
};

/**
 * Determine appropriate HTTP status code
 */
const getStatusCode = (error) => {
  // Check if error already has a status code
  if (error.status) {
    return error.status;
  }
  
  if (error.statusCode) {
    return error.statusCode;
  }
  
  // Map error types to status codes
  if (error.code === 'auth/invalid-token' || error.message.includes('JWT')) {
    return 401;
  }
  
  if (error.code === 'permission-denied') {
    return 403;
  }
  
  if (error.message && error.message.includes('rate limit')) {
    return 429;
  }
  
  if (error.message && error.message.includes('not found')) {
    return 404;
  }
  
  if (error.message && error.message.includes('validation')) {
    return 400;
  }
  
  // Default to 500 for unknown errors
  return 500;
};

/**
 * Async error handler wrapper
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create error with status code
 */
const createError = (message, statusCode = 500, code = null) => {
  const error = new Error(message);
  error.status = statusCode;
  if (code) {
    error.code = code;
  }
  return error;
};

module.exports = {
  errorHandler,
  asyncErrorHandler,
  createError
};