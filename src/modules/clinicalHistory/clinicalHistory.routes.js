const express = require('express');
const router = express.Router();
const clinicalHistoryController = require('./clinicalHistory.controller');
const { verifyToken } = require('../auth/auth.middleware');

/**
 * @route   GET /api/clinical-history/:patientId
 * @desc    Get combined clinical timeline (notes + forms + payments)
 * @query   sort=desc|asc (default: desc)
 * @access  Private (authenticated users with Patients module access)
 */
router.get(
  '/:patientId',
  verifyToken,
  clinicalHistoryController.getClinicalHistory
);

module.exports = router;
