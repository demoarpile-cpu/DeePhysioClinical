const express = require('express');
const router = express.Router();
const serviceController = require('./service.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');
const { createServiceValidation, updateServiceValidation, paramIdValidation } = require('./service.validation');

/**
 * @route   GET /api/services
 * @desc    Get all services (optional ?activeOnly=true)
 * @access  Private (all roles)
 */
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'therapist', 'receptionist', 'billing'),
  serviceController.getAllServices
);

/**
 * @route   GET /api/services/:id
 * @desc    Get single service
 * @access  Private (all roles)
 */
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'therapist', 'receptionist', 'billing'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) {
      return res.status(400).json({ success: false, message: 'Invalid service ID' });
    }
    next();
  },
  serviceController.getServiceById
);

/**
 * @route   POST /api/services
 * @desc    Create a new service
 * @access  Private (admin only)
 */
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin'),
  (req, res, next) => {
    const { error } = createServiceValidation(req.body);

    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }

    next();
  },
  serviceController.createService
);

/**
 * @route   PUT /api/services/:id
 * @desc    Update a service
 * @access  Private (admin only)
 */
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  (req, res, next) => {
    const { error: paramError } = paramIdValidation(req.params);
    if (paramError) {
      return res.status(400).json({ success: false, message: 'Invalid service ID' });
    }

    const { error: bodyError } = updateServiceValidation(req.body);
    if (bodyError) {
      const message = bodyError.details.map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }

    next();
  },
  serviceController.updateService
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete a service
 * @access  Private (admin only)
 */
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) {
      return res.status(400).json({ success: false, message: 'Invalid service ID' });
    }
    next();
  },
  serviceController.deleteService
);

module.exports = router;
