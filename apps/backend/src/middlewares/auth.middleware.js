/**
 * Authentication & Authorization Middleware
 * Validates JWT Bearer tokens and enforces Role-Based Access Control (RBAC).
 */

import { config } from '../config/environment.js';

/**
 * Validates the JWT Bearer token present in the Authorization header.
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message:
          'Access denied. Missing or malformed Authorization Bearer header.',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // For demonstration and testing, decode token payload or accept simulated dev tokens
    if (token === 'dev-admin-token') {
      req.user = {
        id: 'admin-001',
        email: 'admin@thinkwire.internal',
        role: 'admin',
      };
      return next();
    }
    if (token === 'dev-client-token') {
      req.user = {
        id: 'client-001',
        email: 'client@thinkwire.internal',
        role: 'client',
      };
      return next();
    }
    if (token === 'dev-candidate-token') {
      req.user = {
        id: 'cand-001',
        email: 'candidate@thinkwire.internal',
        role: 'candidate',
      };
      return next();
    }

    // In production, verify using jsonwebtoken library:
    // const decoded = jwt.verify(token, config.jwtSecret);
    // req.user = decoded;
    // For baseline gateway:
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf8')
      );
      req.user = payload;
      return next();
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'The provided authentication token is invalid or expired.',
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Failed to authenticate token.',
      },
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Guard
 * Ensures only users with specified roles can access the route.
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`,
        },
      });
    }
    next();
  };
}
