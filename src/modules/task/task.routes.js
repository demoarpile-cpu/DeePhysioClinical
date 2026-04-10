const express = require('express');
const router = express.Router();
const taskController = require('./task.controller.js');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for a patient (via patientId query)
 * @access  Private
 */
router.get('/', verifyToken, authorizeRoles('admin', 'therapist'), taskController.getTasks);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', verifyToken, authorizeRoles('admin', 'therapist'), taskController.createTask);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update an existing task
 * @access  Private
 */
router.put('/:id', verifyToken, authorizeRoles('admin', 'therapist'), taskController.updateTask);

module.exports = router;
