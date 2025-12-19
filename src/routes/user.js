const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { basicAuth } = require('../middleware/auth');
const { validateUserCreate, validateUserUpdate } = require('../utils/validation');

// Helper function to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// POST /v1/user - Create a new user
router.post('/v1/user', async (req, res) => {
  try {
    // Validate request body
    const validationErrors = validateUserCreate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const { first_name, last_name, password, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user (password will be hashed automatically by User model)
    const user = await User.create({
      first_name,
      last_name,
      password,
      username
    });

    // Return 201 with user data (password excluded by toJSON method)
    return res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(400).json({ error: 'Failed to create user' });
  }
});

// GET /v1/user/:userId - Get user information
router.get('/v1/user/:userId', basicAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Validate UUID format
    if (!isValidUUID(userId)) {
      return res.status(400).end();
    }

    // 2. Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).end();
    }

    // 3. Check authorization - user can only access their own info
    if (req.user.id !== userId) {
      return res.status(403).end();
    }

    // Return user data
    return res.status(200).json(req.user);
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(400).end();
  }
});

// PUT /v1/user/:userId - Update user information
router.put('/v1/user/:userId', basicAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Validate UUID format
    if (!isValidUUID(userId)) {
      return res.status(400).end();
    }

    // 2. Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).end();
    }

    // 3. Check authorization - user can only update their own info
    if (req.user.id !== userId) {
      return res.status(403).end();
    }

    // 4. Validate update data
    const validationErrors = validateUserUpdate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // 5. For PUT, all required fields must be present
    const { first_name, last_name, password } = req.body;
    if (!first_name || !last_name || !password) {
      return res.status(400).end();
    }

    // Update fields
    req.user.first_name = first_name;
    req.user.last_name = last_name;
    req.user.password = password; // Will be hashed by setter

    await req.user.save();

    // Return 204 No Content
    return res.status(204).end();
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(400).end();
  }
});

module.exports = router;