const express = require('express');
const router = express.Router();
const { getAllPatients, createPatient, getPatientById, updatePatient, deletePatient, getMedicalHistory, upsertMedicalHistory } = require('./patient.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess, requireAnyActionAccess } = require('../auth/actionAccess.middleware');
const { createPatientValidation, updatePatientValidation, upsertMedicalHistoryValidation, paramIdValidation } = require('./patient.validation');

/**
 * @route   GET /api/patients
 * @desc    Get all patients
 * @access  Private (admin, therapist, receptionist)
 */
router.get(
  '/',
  verifyToken,
  requireAnyActionAccess('patient.basic', 'patient.read'),
  getAllPatients
);

/**
 * @route   POST /api/patients
 * @desc    Create a new patient
 * @access  Private (admin, therapist, receptionist)
 */
router.post(
  '/',
  verifyToken,
  requireActionAccess('patient.write'),
  (req, res, next) => {
    const { error } = createPatientValidation(req.body);

    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }

    next();
  },
  createPatient
);

router.get(
  '/:id/medical-history',
  verifyToken,
  requireActionAccess('patient.read'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }
    next();
  },
  getMedicalHistory
);

router.put(
  '/:id/medical-history',
  verifyToken,
  requireActionAccess('patient.write'),
  (req, res, next) => {
    const { error: paramError } = paramIdValidation(req.params);
    if (paramError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }

    const { error: bodyError } = upsertMedicalHistoryValidation(req.body);
    if (bodyError) {
      const message = bodyError.details.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }

    next();
  },
  upsertMedicalHistory
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get single patient with medical history & emergency contacts
 * @access  Private (admin, therapist, receptionist)
 */
router.get(
  '/:id',
  verifyToken,
  requireAnyActionAccess('patient.basic', 'patient.read'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }

    next();
  },
  getPatientById
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient details
 * @access  Private (admin, therapist, receptionist)
 */
router.put(
  '/:id',
  verifyToken,
  requireActionAccess('patient.write'),
  (req, res, next) => {
    const { error: paramError } = paramIdValidation(req.params);

    if (paramError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }

    const { error: bodyError } = updatePatientValidation(req.body);

    if (bodyError) {
      const message = bodyError.details.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }

    next();
  },
  updatePatient
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete a patient
 * @access  Private (admin, therapist)
 */
router.delete(
  '/:id',
  verifyToken,
  requireActionAccess('patient.delete'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }

    next();
  },
  deletePatient
);

module.exports = router;
