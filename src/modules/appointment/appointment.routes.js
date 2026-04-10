const express = require('express');
const router = express.Router();
const appointmentController = require('./appointment.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess, requireAnyActionAccess } = require('../auth/actionAccess.middleware');
const {
  createAppointmentValidation,
  updateAppointmentValidation,
  updateStatusValidation,
  paramIdValidation
} = require('./appointment.validation');

router.post(
  '/',
  verifyToken,
  requireActionAccess('appointments.manage'),
  (req, res, next) => {
    const { error } = createAppointmentValidation(req.body);

    if (error) {
      const message = error.details.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }

    next();
  },
  appointmentController.createAppointment
);

router.get(
  '/',
  verifyToken,
  requireActionAccess('appointments.view'),
  appointmentController.getAllAppointments
);

router.get(
  '/practitioners',
  verifyToken,
  requireActionAccess('appointments.view'),
  appointmentController.getPractitioners
);

router.get(
  '/:id',
  verifyToken,
  requireActionAccess('appointments.view'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }
    next();
  },
  appointmentController.getAppointmentById
);

router.put(
  '/:id',
  verifyToken,
  requireActionAccess('appointments.manage'),
  (req, res, next) => {
    const { error: paramError } = paramIdValidation(req.params);
    if (paramError) return res.status(400).json({ success: false, message: 'Invalid appointment ID' });

    const { error: bodyError } = updateAppointmentValidation(req.body);
    if (bodyError) return res.status(400).json({ success: false, message: bodyError.details.map(e => e.message).join(', ') });

    next();
  },
  appointmentController.updateAppointment
);

router.delete(
  '/:id',
  verifyToken,
  requireActionAccess('appointments.manage'),
  (req, res, next) => {
    const { error } = paramIdValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    next();
  },
  appointmentController.deleteAppointment
);

router.patch(
  '/:id/status',
  verifyToken,
  requireAnyActionAccess('appointments.manage'),
  (req, res, next) => {
    const { error: paramError } = paramIdValidation(req.params);
    if (paramError) return res.status(400).json({ success: false, message: 'Invalid appointment ID' });

    const { error: bodyError } = updateStatusValidation(req.body);
    if (bodyError) return res.status(400).json({ success: false, message: bodyError.details.map(e => e.message).join(', ') });

    next();
  },
  appointmentController.updateStatus
);

module.exports = router;
