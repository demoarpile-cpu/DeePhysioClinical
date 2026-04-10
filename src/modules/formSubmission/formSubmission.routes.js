const express = require('express');
const router = express.Router();
const controller = require('./formSubmission.controller');
const { verifyToken } = require('../auth/auth.middleware');

/**
 * @route   POST /api/form-submissions
 * @desc    Submit a new assessment form
 * @access  Private
 */
router.post('/', verifyToken, controller.createSubmission);

/**
 * @route   GET /api/form-submissions
 * @desc    Get all submissions for a patient
 * @access  Private
 */
router.get('/', verifyToken, controller.getPatientSubmissions);

/**
 * @route   GET /api/form-submissions/:id
 * @desc    Get a single submission by ID
 * @access  Private
 */
router.get('/:id', verifyToken, controller.getSubmission);

module.exports = router;
