const express = require('express');
const router = express.Router();
const attachmentController = require('./attachment.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');
const { createAttachmentValidation, paramIdValidation } = require('./attachment.validation');

/**
 * @route   GET /api/attachments
 * @desc    Get all attachments
 * @access  Private (all roles)
 */
router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'therapist', 'receptionist'),
  attachmentController.getAllAttachments
);

/**
 * @route   GET /api/attachments/:id
 * @desc    Get single attachment
 * @access  Private (all roles)
 */
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'therapist', 'receptionist'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid attachment ID' });
    next();
  },
  attachmentController.getAttachmentById
);

/**
 * @route   POST /api/attachments
 * @desc    Create a new attachment
 * @access  Private (admin, therapist, receptionist)
 */
router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'therapist', 'receptionist'),
  (req, res, next) => {
    const { error } = createAttachmentValidation(req.body);
    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    next();
  },
  attachmentController.createAttachment
);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    Delete an attachment
 * @access  Private (admin, therapist)
 */
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'therapist'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid attachment ID' });
    next();
  },
  attachmentController.deleteAttachment
);

module.exports = router;
