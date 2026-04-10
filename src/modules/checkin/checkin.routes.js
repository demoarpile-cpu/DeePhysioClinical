const express = require('express');
const router = express.Router();
const checkinController = require('./checkin.controller');
const { searchAppointmentValidation, markAsArrivedValidation } = require('./checkin.validation');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');

// Route: POST /search
// Restricted to staff who can handle appointments
router.post('/search', verifyToken, authorizeRoles('admin', 'therapist', 'receptionist'), (req, res, next) => {
  const { error } = searchAppointmentValidation(req.body);

  if (error) {
    const message = error.details.map((err) => err.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }

  next();
}, checkinController.searchAppointment);

// Route: POST /arrive
// Restricted to staff who can handle appointments
router.post('/arrive', verifyToken, authorizeRoles('admin', 'therapist', 'receptionist'), (req, res, next) => {
  const { error } = markAsArrivedValidation(req.body);

  if (error) {
    const message = error.details.map((err) => err.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }

  next();
}, checkinController.markAsArrived);

module.exports = router;
