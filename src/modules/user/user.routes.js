const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, getMe, createUser, updateUser, deleteUser } = require('./user.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess } = require('../auth/actionAccess.middleware');
const { createUserValidation } = require('./user.validation');

/**
 * @route   GET /api/users/me
 * @desc    Get current user's own profile & permissions
 * @access  Private (any authenticated user)
 */
router.get('/me', verifyToken, getMe);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', verifyToken, requireActionAccess('users.manage'), getAllUsers);
router.get('/:id', verifyToken, requireActionAccess('users.manage'), getUserById);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin only)
 */
router.post(
    '/',
    verifyToken,
    requireActionAccess('users.manage'),

    // 🔥 VALIDATION ADD
    (req, res, next) => {
        const { error } = createUserValidation(req.body);

        if (error) {
            const message = error.details.map(err => err.message).join(', ');
            return res.status(400).json({
                success: false,
                message
            });
        }

        next();
    },

    createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Private (Admin only)
 */
router.put('/:id', verifyToken, requireActionAccess('users.manage'), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (Admin only)
 */
router.delete('/:id', verifyToken, requireActionAccess('users.manage'), deleteUser);

module.exports = router;
