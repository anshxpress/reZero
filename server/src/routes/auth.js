import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { config } from '../config.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required. Please login first.' });
    }

    // Check if it's Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid authorization header format. Use: Bearer <token>' });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (!decoded.userId) {
        return res.status(401).json({ error: 'Invalid token: missing user ID' });
      }

      const user = await User.findById(decoded.userId);
      
      if (!user) {
        logger.warn('Token references non-existent user', { userId: decoded.userId });
        return res.status(401).json({ error: 'Invalid token: user not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is inactive. Please contact support.' });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        logger.warn('Token expired', { error: jwtError.message });
        return res.status(401).json({ error: 'Token expired. Please login again.' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        logger.error('Token verification failed', { error: jwtError.message });
        return res.status(401).json({ error: 'Invalid token. Please login again.' });
      } else {
        logger.error('Token verification error', { error: jwtError.message });
        return res.status(401).json({ error: 'Authentication failed. Please login again.' });
      }
    }
  } catch (error) {
    logger.error('Authentication middleware error', { error: error.message });
    return res.status(500).json({ error: 'Authentication error occurred' });
  }
};

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Log registration
    await AuditLog.logAction({
      userId: user._id,
      action: 'user_register',
      resourceType: 'user',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    logger.info('User registered successfully', { userId: user._id, email });

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON()
    });

  } catch (error) {
    logger.error('User registration failed', { error: error.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Log login
    await AuditLog.logAction({
      userId: user._id,
      action: 'user_login',
      resourceType: 'user',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    logger.info('User logged in successfully', { userId: user._id, email });

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    logger.error('User login failed', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toJSON()
    });
  } catch (error) {
    logger.error('Get profile failed', { error: error.message });
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('preferences').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, preferences } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    // Log profile update
    await AuditLog.logAction({
      userId: user._id,
      action: 'user_update',
      resourceType: 'user',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    logger.info('User profile updated', { userId: user._id });

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    logger.error('Profile update failed', { error: error.message });
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Logout user (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log logout
    await AuditLog.logAction({
      userId: req.user._id,
      action: 'user_logout',
      resourceType: 'user',
      resourceId: req.user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    logger.info('User logged out', { userId: req.user._id });

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
