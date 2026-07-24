import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const isProduction = process.env.NODE_ENV === 'production';

// Single source of truth for session lifetime so the JWT itself and the
// cookie that carries it can't drift out of sync (they previously did:
// the token was signed for 30d while JWT_EXPIRY=7d sat unused).
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const expiryMatch = /^(\d+)d$/.exec(JWT_EXPIRY);
const COOKIE_MAX_AGE_MS = (expiryMatch ? Number(expiryMatch[1]) : 7) * 24 * 60 * 60 * 1000;

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
};

// Cross-site (e.g. Vercel frontend -> Render backend) requires SameSite=None + Secure;
// localhost dev is not HTTPS, so it needs Lax + non-Secure instead.
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { username } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      password
    });

    if (user) {
      const token = generateToken(user.id);
      setTokenCookie(res, token);
      res.status(201).json({
        _id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check for user email
    const user = await User.findOne({ where: { username } });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user.id);
      setTokenCookie(res, token);
      res.json({
        _id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log out the current user
// @route   POST /api/auth/logout
export const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out' });
};

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
export const getMe = (req, res) => {
  res.json({
    _id: req.user.id,
    username: req.user.username,
    isAdmin: req.user.isAdmin,
  });
};

// @desc    Change the current user's own password
// @route   PUT /api/auth/password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
