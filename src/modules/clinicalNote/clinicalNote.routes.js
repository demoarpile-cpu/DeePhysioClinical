const express = require('express');
const router = express.Router();
const clinicalNoteController = require('./clinicalNote.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess } = require('../auth/actionAccess.middleware');
const { createClinicalNoteValidation, updateClinicalNoteValidation, paramIdValidation } = require('./clinicalNote.validation');

/**
 * @route   GET /api/clinical-notes
 * @desc    Get all clinical notes (optional filters: patientId, therapistId, status)
 * @access  Private (admin, therapist)
 */
router.get(
  '/',
  verifyToken,
  requireActionAccess('notes.view'),
  clinicalNoteController.getAllClinicalNotes
);

/**
 * @route   GET /api/clinical-notes/:id
 * @desc    Get single clinical note
 * @access  Private (admin, therapist)
 */
router.get(
  '/:id',
  verifyToken,
  requireActionAccess('notes.view'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) {
      return res.status(400).json({ success: false, message: 'Invalid clinical note ID' });
    }
    next();
  },
  clinicalNoteController.getClinicalNoteById
);

/**
 * @route   POST /api/clinical-notes
 * @desc    Create a new clinical note
 * @access  Private (admin, therapist)
 */
router.post(
  '/',
  verifyToken,
  requireActionAccess('notes.manage'),
  (req, res, next) => {
    const { error } = createClinicalNoteValidation(req.body);

    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }

    next();
  },
  clinicalNoteController.createClinicalNote
);

/**
 * @route   PUT /api/clinical-notes/:id
 * @desc    Update a clinical note
 * @access  Private (admin, therapist)
 */
router.put(
  '/:id',
  verifyToken,
  requireActionAccess('notes.manage'),
  (req, res, next) => {
    const { error: paramError } = paramIdValidation(req.params);
    if (paramError) {
      return res.status(400).json({ success: false, message: 'Invalid clinical note ID' });
    }

    const { error: bodyError } = updateClinicalNoteValidation(req.body);
    if (bodyError) {
      const message = bodyError.details.map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }

    next();
  },
  clinicalNoteController.updateClinicalNote
);

/**
 * @route   DELETE /api/clinical-notes/:id
 * @desc    Delete a clinical note
 * @access  Private (admin, therapist)
 */
router.delete(
  '/:id',
  verifyToken,
  requireActionAccess('notes.manage'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) {
      return res.status(400).json({ success: false, message: 'Invalid clinical note ID' });
    }
    next();
  },
  clinicalNoteController.deleteClinicalNote
);

module.exports = router;
