import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'techreachly_super_secure_jwt_secret_key_2026');

      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }

      return next();
    } catch (error) {
      console.error('[AuthMiddleware] JWT Verification Failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

/**
 * Optional protection middleware:
 * If an Authorization Bearer token is provided, verify it and attach req.user.
 * If no token is provided or the token is invalid/expired, proceed as guest (req.user = null).
 */
export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'techreachly_super_secure_jwt_secret_key_2026');
        req.user = await User.findById(decoded.id).select('-passwordHash');
      }
    } catch (error) {
      // Token is invalid/expired - proceed as guest
      req.user = null;
    }
  } else {
    req.user = null;
  }

  return next();
};

/**
 * Role-based guard:
 * Verifies that the authenticated user has an 'admin' role.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required.',
    });
  }
  return next();
};

