const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess } = require('../auth/actionAccess.middleware');
const { createPaymentValidation, paramIdValidation } = require('./payment.validation');

/**
 * @route   GET /api/payments
 * @desc    Get all payments
 * @access  Private (admin, billing, therapist, receptionist)
 */
router.get(
  '/',
  verifyToken,
  requireActionAccess('billing.view'),
  paymentController.getAllPayments
);

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private (admin, billing)
 */
router.post(
  '/',
  verifyToken,
  requireActionAccess('billing.manage'),
  (req, res, next) => {
    const { error } = createPaymentValidation(req.body);
    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    next();
  },
  paymentController.createPayment
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get single payment
 * @access  Private (admin, billing, therapist, receptionist)
 */
router.get(
  '/:id',
  verifyToken,
  requireActionAccess('billing.view'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    next();
  },
  paymentController.getPaymentById
);

/**
 * @route   DELETE /api/payments/:id
 * @desc    Delete a payment
 * @access  Private (admin, billing)
 */
router.delete(
  '/:id',
  verifyToken,
  requireActionAccess('billing.manage'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    next();
  },
  paymentController.deletePayment
);

module.exports = router;
