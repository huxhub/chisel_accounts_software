import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  // Prefer the httpOnly cookie; fall back to a Bearer header for non-browser API clients.
  const token = req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in the environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized' });
  }
};

// Must run after `protect`. Guards destructive/administrative actions
// (bulk delete, creating new logins) that any authenticated user shouldn't
// be able to trigger on their own.
export const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
};
