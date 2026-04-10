const express = require('express');
const router = express.Router();
const { getWaitlist, createWaitlistEntry, deleteWaitlistEntry, convertWaitlistToAppointment } = require('./waitlist.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');
const { createWaitlistValidation, paramIdValidation } = require('./waitlist.validation');

/**
 * @route   GET /api/waitlist
 * @desc    Get all waitlist entries
 * @access  Private (admin, receptionist, therapist)
 */
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'receptionist', 'therapist'),
  getWaitlist
);

/**
 * @route   POST /api/waitlist
 * @desc    Create a new waitlist entry
 * @access  Private (admin, receptionist)
 */
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'receptionist'),
  (req, res, next) => {
    const { error } = createWaitlistValidation(req.body);

    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }

    next();
  },
  createWaitlistEntry
);

/**
 * @route   DELETE /api/waitlist/:id
 * @desc    Delete a waitlist entry
 * @access  Private (admin, receptionist)
 */
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'receptionist'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid waitlist entry ID'
      });
    }

    next();
  },
  deleteWaitlistEntry
);

/**
 * @route   POST /api/waitlist/:id/convert
 * @desc    Convert a waitlist entry into an appointment
 * @access  Private (admin, receptionist)
 */
router.post(
  '/:id/convert',
  verifyToken,
  authorizeRoles('admin', 'receptionist'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid waitlist entry ID'
      });
    }

    next();
  },
  convertWaitlistToAppointment
);

module.exports = router;

