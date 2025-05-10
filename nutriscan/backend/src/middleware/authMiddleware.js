const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');
const { AuthenticationError, UnauthorizedAccessError } = require('../utils/customErrors');

class AuthMiddleware {
  // JWT token generation
  static generateToken(user, expiresIn = '7d') {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenType: 'access'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn,
      algorithm: 'HS256'
    });
  }

  // Refresh token generation
  static generateRefreshToken(user) {
    const payload = {
      id: user._id,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { 
      expiresIn: '30d',
      algorithm: 'HS256'
    });
  }

  // Authentication middleware
  static async authenticate(req, res, next) {
    try {
      // Extract token
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        throw new AuthenticationError('No authentication token provided');
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
      });

      // Check token type
      if (decoded.tokenType !== 'access') {
        throw new AuthenticationError('Invalid token type');
      }

      // Find user and check status
      const user = await User.findById(decoded.id).select('+status');
      
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Check user account status
      if (user.status !== 'active') {
        throw new UnauthorizedAccessError('Account is not active');
      }

      // Attach user to request
      req.user = user;
      req.token = token;

      // Log authentication
      logger.info('User authenticated', { 
        userId: user._id, 
        email: user.email 
      });

      next();
    } catch (error) {
      // Handle different types of authentication errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token expired. Please log in again.',
          error: 'TOKEN_EXPIRED'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Invalid token',
          error: 'INVALID_TOKEN'
        });
      }

      // Log security event
      logger.security('Authentication attempt failed', { 
        error: error.message,
        ip: req.ip
      });

      next(error);
    }
  }

  // Role-based authorization middleware
  static authorize(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        throw new UnauthorizedAccessError('Insufficient permissions');
      }
      next();
    };
  }

  // Two-factor authentication middleware
  static async requireTwoFactor(req, res, next) {
    try {
      const user = req.user;

      if (!user.twoFactorEnabled) {
        throw new UnauthorizedAccessError('Two-factor authentication is required');
      }

      // Check if 2FA is validated in current session
      if (!req.session.twoFactorVerified) {
        return res.status(403).json({
          message: 'Two-factor authentication required',
          requireTwoFactor: true
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  // Generate secure one-time password
  static generateOTP(length = 6) {
    return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
  }

  // Rate limiting for authentication attempts
  static async rateLimitAuthentication(req, res, next) {
    try {
      const ip = req.ip;
      const attempts = await this.checkAuthenticationAttempts(ip);

      if (attempts >= 5) {
        // Temporary account lock
        await this.lockTemporarily(ip);
        
        throw new UnauthorizedAccessError('Too many authentication attempts. Account temporarily locked.');
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  // Check and record authentication attempts
  static async checkAuthenticationAttempts(ip) {
    // Implement Redis-based rate limiting
    // This is a placeholder - actual implementation would use Redis
    return 0;
  }

  // Temporarily lock account
  static async lockTemporarily(ip) {
    // Implement temporary IP/account locking mechanism
    // This is a placeholder - actual implementation would use Redis
  }
}

module.exports = AuthMiddleware;
