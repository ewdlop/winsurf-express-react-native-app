const logger = require('../utils/logger');
const { NutriScanBaseError } = require('../utils/customErrors');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled Error', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    user: req.user ? req.user.id : 'Unauthenticated',
    error: err
  });

  // Handle custom NutriScan errors
  if (err instanceof NutriScanBaseError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        timestamp: err.timestamp
      }
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: validationErrors
      }
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY_ERROR',
        message: `${duplicateField} already exists`,
        field: duplicateField
      }
    });
  }

  // Handle JWT authentication errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired authentication token'
      }
    });
  }

  // Handle network and external service errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'External service is currently unavailable'
      }
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
};

// Async error wrapper to handle promise rejections
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  asyncErrorHandler
};
