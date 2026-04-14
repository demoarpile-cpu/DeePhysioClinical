const express = require('express');
const router = express.Router();
const taskController = require('./task.controller.js');
const { verifyToken } = require('../auth/auth.middleware');
const { requireAnyActionAccess } = require('../auth/actionAccess.middleware');

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for a patient (via patientId query)
 * @access  Private
 */
router.get(
  '/',
  verifyToken,
  requireAnyActionAccess('patient.read', 'patient.basic'),
  taskController.getTasks
);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post(
  '/',
  verifyToken,
  requireAnyActionAccess('patient.write'),
  taskController.createTask
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update an existing task
 * @access  Private
 */
router.put(
  '/:id',
  verifyToken,
  requireAnyActionAccess('patient.write'),
  taskController.updateTask
);

module.exports = router;
