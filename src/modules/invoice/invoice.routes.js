const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess } = require('../auth/actionAccess.middleware');
const { createInvoiceValidation, paramIdValidation } = require('./invoice.validation');

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices
 * @access  Private (admin, billing, therapist, receptionist)
 */
router.get(
  '/',
  verifyToken,
  requireActionAccess('billing.view'),
  invoiceController.getAllInvoices
);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get single invoice
 * @access  Private (admin, billing, therapist, receptionist)
 */
router.get(
  '/:id',
  verifyToken,
  requireActionAccess('billing.view'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
    next();
  },
  invoiceController.getInvoiceById
);

router.get(
  '/:id/download',
  verifyToken,
  requireActionAccess('billing.view'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
    next();
  },
  invoiceController.downloadInvoice
);

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice
 * @access  Private (admin, billing)
 */
router.post(
  '/',
  verifyToken,
  requireActionAccess('billing.manage'),
  (req, res, next) => {
    const { error } = createInvoiceValidation(req.body);
    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    next();
  },
  invoiceController.createInvoice
);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete an invoice
 * @access  Private (admin, billing)
 */
router.delete(
  '/:id',
  verifyToken,
  requireActionAccess('billing.manage'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
    next();
  },
  invoiceController.deleteInvoice
);

module.exports = router;
