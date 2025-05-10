const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuthMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { AuthenticationError, ValidationError } = require('../utils/customErrors');

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { 
      username, 
      email, 
      password, 
      dietaryRestrictions, 
      healthGoals,
      profileDetails
    } = req.body;

    // Validate input
    if (!username || !email || !password) {
      throw new ValidationError('Missing required registration fields', [
        { field: 'username', message: 'Username is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      throw new AuthenticationError('User already exists');
    }

    // Create new user with enhanced security
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      dietaryRestrictions,
      healthGoals,
      profileDetails,
      status: 'active',
      lastLogin: null,
      loginAttempts: 0,
      twoFactorEnabled: false
    });

    await newUser.save();

    // Generate tokens
    const accessToken = AuthMiddleware.generateToken(newUser);
    const refreshToken = AuthMiddleware.generateRefreshToken(newUser);

    // Log registration
    logger.info('User registered successfully', { 
      userId: newUser._id, 
      email: newUser.email 
    });

    res.status(201).json({ 
      accessToken, 
      refreshToken,
      user: { 
        id: newUser._id, 
        username: newUser.username, 
        email: newUser.email,
        role: newUser.role
      } 
    });
  } catch (error) {
    // Log registration error
    logger.error('User registration failed', { 
      error: error.message,
      email: req.body.email 
    });

    next(error);
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get user profile (protected route)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { dietaryRestrictions, healthGoals } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { dietaryRestrictions, healthGoals }, 
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
