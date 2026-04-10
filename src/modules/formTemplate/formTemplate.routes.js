const express = require('express');
const router = express.Router();
const templateController = require('./formTemplate.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess } = require('../auth/actionAccess.middleware');
const { createTemplateValidation, updateTemplateValidation, paramIdValidation } = require('./formTemplate.validation');

/**
 * @route   GET /api/form-templates
 * @desc    Get all form templates
 * @access  Private (forms.view)
 */
router.get(
  '/',
  verifyToken,
  requireActionAccess('forms.view'),
  templateController.getAllTemplates
);

/**
 * @route   GET /api/form-templates/:id
 * @desc    Get single template
 * @access  Private (forms.view)
 */
router.get(
  '/:id',
  verifyToken,
  requireActionAccess('forms.view'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid template ID' });
    next();
  },
  templateController.getTemplateById
);

/**
 * @route   POST /api/form-templates
 * @desc    Create a new template
 * @access  Private (forms.manage)
 */
router.post(
  '/',
  verifyToken,
  requireActionAccess('forms.manage'),
  (req, res, next) => {
    const { error } = createTemplateValidation(req.body);
    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    next();
  },
  templateController.createTemplate
);

/**
 * @route   PUT /api/form-templates/:id
 * @desc    Update a template
 * @access  Private (forms.manage)
 */
router.put(
  '/:id',
  verifyToken,
  requireActionAccess('forms.manage'),
  (req, res, next) => {
    const { error: paramError } = paramIdValidation(req.params);
    if (paramError) return res.status(400).json({ success: false, message: 'Invalid template ID' });

    const { error: bodyError } = updateTemplateValidation(req.body);
    if (bodyError) {
      const message = bodyError.details.map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    next();
  },
  templateController.updateTemplate
);

/**
 * @route   DELETE /api/form-templates/:id
 * @desc    Delete a template
 * @access  Private (forms.manage)
 */
router.delete(
  '/:id',
  verifyToken,
  requireActionAccess('forms.manage'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid template ID' });
    next();
  },
  templateController.deleteTemplate
);

module.exports = router;
