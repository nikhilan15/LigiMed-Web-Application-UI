import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// In-memory revoked tokens set (for logout support)
export const tokenBlacklist = new Set();

export function revokeToken(token) {
  if (token) {
    tokenBlacklist.add(token);
  }
}

export function isTokenRevoked(token) {
  return tokenBlacklist.has(token);
}

export function clearTokenBlacklist() {
  tokenBlacklist.clear();
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token missing or invalid format' });
  }

  const token = authHeader.split(' ')[1];
  if (isTokenRevoked(token)) {
    return res.status(401).json({ success: false, message: 'Token has been revoked/logged out' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function optionalToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (!isTokenRevoked(token)) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        req.token = token;
      } catch (err) {
        // Ignore invalid optional tokens
      }
    }
  }
  next();
}

export function checkRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Authentication required' });
    }
    const roleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (roleList.length > 0 && !roleList.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Forbidden: Access restricted for role '${req.user.role}'` });
    }
    next();
  };
}

