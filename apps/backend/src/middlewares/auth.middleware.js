import {
  verifyCandidateToken,
  verifyAdminToken,
  isTokenRevoked,
} from '../utils/auth.util.js';
import Candidate from '../models/candidate.mongo.model.js';
import UserMongo from '../models/user.mongo.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

const VALID_PORTAL_ROLES = new Set(['superadmin', 'admin', 'cms_admin']);

export const requireAuth = (
  allowedRoles = ['superadmin', 'admin', 'cms_admin']
) => {
  return async (req, res, next) => {
    try {
      let token = null;

      if (req.cookies && req.cookies.thinkwires_admin_jwt) {
        token = req.cookies.thinkwires_admin_jwt;
      } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
      ) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.headers['x-admin-token']) {
        token = req.headers['x-admin-token'];
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error:
            'Authentication required. Please log in with your official credentials to access the admin portal.',
        });
      }

      if (await isTokenRevoked(token)) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Admin session has been revoked. Please log in again.',
        });
      }

      let decoded;
      try {
        decoded = verifyAdminToken(token);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            authenticated: false,
            error: 'Admin session expired. Please log in again.',
          });
        }
        return res.status(401).json({
          success: false,
          authenticated: false,
          error:
            'Invalid or forged admin authentication session. Please log in again.',
        });
      }

      if (
        !decoded ||
        !decoded.email ||
        !decoded.role ||
        typeof decoded.role !== 'string' ||
        !decoded.role.trim()
      ) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Malformed admin authentication credentials: role or email claim missing.',
        });
      }

      let userObj = {
        id: decoded.id,
        name: decoded.name || 'System Member',
        email: decoded.email,
        role: decoded.role.toLowerCase().trim(),
        designation: decoded.designation || 'System Member',
      };

      // P0 Security Requirement C: Fail closed in production when MongoDB cannot verify the user
      if (mongoose.connection.readyState !== 1) {
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({
            success: false,
            authenticated: false,
            error:
              'Database connection temporarily unavailable: canonical user database is disconnected.',
            retryAfterSeconds: 5,
          });
        }
      } else {
        try {
          const dbUser = mongoose.Types.ObjectId.isValid(decoded.id)
            ? await UserMongo.findById(decoded.id).select('+tokenVersion -password').lean()
            : await UserMongo.findOne({ email: decoded.email.toLowerCase() })
                .select('+tokenVersion -password')
                .lean();

          if (dbUser) {
            if (dbUser.isActive === false) {
              return res.status(403).json({
                success: false,
                error:
                  'Your administrative account has been deactivated. Please contact your Superadmin.',
              });
            }

            // Issue #197 / P0 Security Requirement C: Validate tokenVersion against database record
            if (
              dbUser.tokenVersion !== undefined &&
              decoded.tokenVersion !== undefined &&
              decoded.tokenVersion !== dbUser.tokenVersion
            ) {
              return res.status(401).json({
                success: false,
                authenticated: false,
                error:
                  'Session has been invalidated due to a security update or password change. Please log in again.',
              });
            }

            // Role Downgrade Protection: Canonical database role always supersedes stale JWT claims
            const canonicalRole = typeof dbUser.role === 'string' && dbUser.role.trim()
              ? dbUser.role.toLowerCase().trim()
              : decoded.role.toLowerCase().trim();

            userObj = {
              id: dbUser._id ? dbUser._id.toString() : dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: canonicalRole,
              designation: dbUser.designation,
              isActive: dbUser.isActive,
            };
          } else if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({
              success: false,
              authenticated: false,
              error: 'Admin user record not found. Access denied.',
            });
          }
        } catch (dbErr) {
          console.error('Admin user DB verification notice:', dbErr.message);
          if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({
              success: false,
              error:
                'Authorization verification service temporarily unavailable. Please retry.',
            });
          }
        }
      }

      req.user = userObj;

      if (!userObj.role || typeof userObj.role !== 'string' || !userObj.role.trim()) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Authentication failed: User role is missing or malformed.',
        });
      }

      const role = userObj.role.toLowerCase().trim();

      if (!VALID_PORTAL_ROLES.has(role)) {
        return res.status(403).json({
          success: false,
          error: `Permission Denied: Assigned role (${role}) is unrecognized or unauthorized.`,
          currentRole: role,
        });
      }

      if (
        role !== 'superadmin' &&
        allowedRoles.length > 0 &&
        !allowedRoles.includes(role)
      ) {
        return res.status(403).json({
          success: false,
          error: `Permission Denied: Your assigned role (${role.toUpperCase()}) is not authorized for this operation. Requires ${allowedRoles.join(' or ')}.`,
          currentRole: role,
        });
      }

      next();
    } catch (error) {
      console.error('Admin requireAuth error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal authorization error.',
      });
    }
  };
};

/**
 * RBAC Helper Middleware: enforces specific roles on route groups.
 * Superadmin automatically bypasses module restrictions.
 * Fails closed with 401 if unauthenticated, and 403 if role is unauthorized or unrecognized.
 */
export const requireRole = (...allowedRoles) => {
  const rolesList = allowedRoles.flat().map((r) => String(r).toLowerCase().trim());
  return (req, res, next) => {
    // 1. Must have req.user object
    if (!req.user || typeof req.user !== 'object') {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error:
          'Authentication required. An active authenticated session is required to verify permissions.',
        code: 'AUTH_REQUIRED',
      });
    }

    // 2. Must have explicit, non-empty string req.user.role
    if (
      !req.user.role ||
      typeof req.user.role !== 'string' ||
      !req.user.role.trim()
    ) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Authentication required: User role is missing, null, or malformed.',
        code: 'ROLE_REQUIRED',
      });
    }

    // 3. Normalize role
    const role = req.user.role.toLowerCase().trim();

    // 4. Validate that role is recognized within system role hierarchy
    if (!VALID_PORTAL_ROLES.has(role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Assigned role is invalid or unrecognized by security policy.',
        code: 'INVALID_ROLE',
        currentRole: role,
      });
    }

    // 5. Explicitly verified Superadmin bypasses module-level restrictions
    if (role === 'superadmin') {
      return next();
    }

    // 6. Check if role is in allowed roles
    if (rolesList.length > 0 && !rolesList.includes(role)) {
      const isManpowerRestricted =
        role === 'cms_admin' && !rolesList.includes('cms_admin');
      const isCmsRestricted = role === 'admin' && !rolesList.includes('admin');

      let errorMsg = `Access Denied: ${role.toUpperCase()} role is not authorized for this module. Requires ${rolesList.join(' or ')}.`;
      let code = 'RBAC_ACCESS_DENIED';

      if (isManpowerRestricted) {
        errorMsg =
          'Access Denied: Your account role is CMS Admin. CMS Admins have access restricted exclusively to the Content Management System (CMS). Manpower, Candidate, and Placement records are inaccessible.';
        code = 'RBAC_CMS_ADMIN_RESTRICTED';
      } else if (isCmsRestricted) {
        errorMsg =
          'Access Denied: Your account role is Admin. Admins have access restricted exclusively to Manpower, Workforce, and Recruitment operations. Content Management System (CMS) is inaccessible.';
        code = 'RBAC_ADMIN_CMS_RESTRICTED';
      }

      return res.status(403).json({
        success: false,
        error: errorMsg,
        code,
        requiredRoles: rolesList,
        currentRole: role,
      });
    }

    next();
  };
};

/**
 * Validates whether an incoming request is authorized to view sensitive internal telemetry
 * (such as datastore topologies, memory consumption, architecture, and uptime).
 * Returns true unconditionally in non-production environments (development / test).
 * In production, requires a valid Superadmin/Admin token or internal monitoring key.
 */
export const isAuthorizedDiagnosticRequest = (req) => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return true;

  try {
    let token = null;
    if (req.cookies && req.cookies.thinkwires_admin_jwt) {
      token = req.cookies.thinkwires_admin_jwt;
    } else if (
      req.headers?.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers && req.headers['x-admin-token']) {
      token = req.headers['x-admin-token'];
    }

    if (token) {
      const decoded = verifyAdminToken(token);
      if (
        decoded &&
        ['superadmin', 'admin'].includes((decoded.role || '').toLowerCase())
      ) {
        return true;
      }
    }

    const internalKey = process.env.INTERNAL_MONITORING_KEY;
    if (
      internalKey &&
      req.headers &&
      req.headers['x-monitoring-key'] &&
      req.headers['x-monitoring-key'] === internalKey
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

export const requireCandidateAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.thinkwires_candidate_jwt) {
      token = req.cookies.thinkwires_candidate_jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error:
          'Authentication required. Please log in to access this candidate resource.',
      });
    }

    if (await isTokenRevoked(token)) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Candidate session has been revoked. Please log in again.',
      });
    }

    const decoded = verifyCandidateToken(token);

    if (!decoded || !decoded.id || decoded.role !== 'candidate') {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Invalid authentication session.',
      });
    }

    let candidate = null;
    if (mongoose.connection.readyState === 1) {
      candidate = await Candidate.findById(decoded.id).select(
        '-password -resetPasswordToken -resetPasswordExpire'
      );
      if (!candidate) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Candidate account not found or has been deactivated.',
        });
      }

      if (candidate.isActive === false) {
        return res.status(403).json({
          success: false,
          error: 'Your candidate account has been deactivated.',
        });
      }

      // Issue #197: Validate candidate tokenVersion against database record
      if (
        candidate.tokenVersion !== undefined &&
        decoded.tokenVersion !== undefined &&
        decoded.tokenVersion !== candidate.tokenVersion
      ) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error:
            'Session has been invalidated due to a security update or password change. Please log in again.',
        });
      }
    } else {
      // In production, MongoDB is required for authentication
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          error: 'Authentication database is currently unavailable.',
        });
      }
      // Non-production fallback representation from token payload
      candidate = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: 'candidate',
      };
    }

    req.candidate = candidate;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      authenticated: false,
      error: 'Invalid or forged authentication token.',
    });
  }
};

/**
 * Universal Authenticator for Candidate or Admin sessions
 * Verifies either candidate JWT or admin JWT and populates req.user
 */
export const authenticateCandidateOrAdmin = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.thinkwires_admin_jwt) {
      token = req.cookies.thinkwires_admin_jwt;
    } else if (req.cookies && req.cookies.thinkwires_candidate_jwt) {
      token = req.cookies.thinkwires_candidate_jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-admin-token']) {
      token = req.headers['x-admin-token'];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Authentication token required.',
      });
    }

    let decoded = null;
    let isAdmin = false;

    try {
      decoded = verifyAdminToken(token);
      if (await isTokenRevoked(token)) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Session has been revoked.',
        });
      }
      isAdmin = true;
    } catch {
      try {
        decoded = verifyCandidateToken(token);
        if (await isTokenRevoked(token)) {
          return res.status(401).json({
            success: false,
            authenticated: false,
            error: 'Session has been revoked.',
          });
        }
      } catch (candErr) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error:
            candErr.name === 'TokenExpiredError'
              ? 'Session expired.'
              : 'Invalid token.',
        });
      }
    }

    if (
      !decoded ||
      !decoded.role ||
      typeof decoded.role !== 'string' ||
      !decoded.role.trim()
    ) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error:
          'Authentication failed: Missing or malformed role claim in token.',
      });
    }

    req.user = {
      id: decoded.id || decoded._id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role.toLowerCase().trim(),
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      error: 'Authentication failed.',
    });
  }
};

/**
 * Optional Candidate Authenticator
 * Populates req.candidate if valid session exists, but allows guest applicants through
 */
export const optionalCandidateAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.thinkwires_candidate_jwt) {
      token = req.cookies.thinkwires_candidate_jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.candidate = null;
      return next();
    }

    try {
      const decoded = verifyCandidateToken(token);
      if (decoded && decoded.id) {
        if (mongoose.connection.readyState === 1) {
          const candidate = await Candidate.findById(decoded.id).select(
            '-password'
          );
          if (candidate) {
            req.candidate = candidate;
          }
        } else {
          req.candidate = {
            _id: decoded.id,
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: 'candidate',
          };
        }
      }
    } catch {
      req.candidate = null;
    }

    next();
  } catch {
    req.candidate = null;
    next();
  }
};

export default requireAuth;
