// Base custom error class
class NutriScanBaseError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Authentication Errors
class AuthenticationError extends NutriScanBaseError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class UnauthorizedAccessError extends NutriScanBaseError {
  constructor(message = 'Unauthorized access') {
    super(message, 403, 'UNAUTHORIZED_ACCESS');
  }
}

// Validation Errors
class ValidationError extends NutriScanBaseError {
  constructor(message = 'Validation failed', validationErrors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.validationErrors = validationErrors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors
    };
  }
}

// Resource Errors
class ResourceNotFoundError extends NutriScanBaseError {
  constructor(resourceName, resourceId) {
    super(`${resourceName} with ID ${resourceId} not found`, 404, 'RESOURCE_NOT_FOUND');
    this.resourceName = resourceName;
    this.resourceId = resourceId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resourceName: this.resourceName,
      resourceId: this.resourceId
    };
  }
}

// Database Errors
class DatabaseConnectionError extends NutriScanBaseError {
  constructor(message = 'Database connection failed') {
    super(message, 500, 'DATABASE_CONNECTION_ERROR');
  }
}

class DatabaseOperationError extends NutriScanBaseError {
  constructor(operation, details) {
    super(`Database operation failed: ${operation}`, 500, 'DATABASE_OPERATION_ERROR');
    this.operation = operation;
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      details: this.details
    };
  }
}

// External Service Errors
class ExternalServiceError extends NutriScanBaseError {
  constructor(serviceName, message = 'External service request failed') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.serviceName = serviceName;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      serviceName: this.serviceName
    };
  }
}

// Rate Limiting Errors
class RateLimitExceededError extends NutriScanBaseError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Business Logic Errors
class BusinessLogicError extends NutriScanBaseError {
  constructor(message, businessContext = {}) {
    super(message, 400, 'BUSINESS_LOGIC_ERROR');
    this.businessContext = businessContext;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      businessContext: this.businessContext
    };
  }
}

module.exports = {
  NutriScanBaseError,
  AuthenticationError,
  UnauthorizedAccessError,
  ValidationError,
  ResourceNotFoundError,
  DatabaseConnectionError,
  DatabaseOperationError,
  ExternalServiceError,
  RateLimitExceededError,
  BusinessLogicError
};
