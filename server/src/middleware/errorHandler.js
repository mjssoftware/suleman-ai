const logger = require('../utils/logger');

class ErrorHandler {
  // Global error handler middleware
  handleError(err, req, res, next) {
    // Log error
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      user: req.user?.userId || 'anonymous'
    });
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        details: errors
      });
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        error: 'Duplicate Error',
        message: `${field} already exists`
      });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired'
      });
    }
    
    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal Server Error';
    
    res.status(statusCode).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // 404 handler
  handleNotFound(req, res) {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.url}`
    });
  }
  
  // Async wrapper to catch errors
  catchAsync(fn) {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  }
}

module.exports = new ErrorHandler();