const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, changePassword } = require('./auth.controller');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, changePasswordValidation } = require('./auth.validation');
const { verifyToken } = require('./auth.middleware');

router.post('/register', (req, res, next) => {
  const { error } = registerValidation(req.body);
  if (error) {
    const message = error.details.map(err => err.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }
  next();
}, registerUser);

router.post('/login', (req, res, next) => {
  const { error } = loginValidation(req.body);
  if (error) {
    const message = error.details.map(err => err.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }
  next();
}, loginUser);

router.post('/forgot-password', (req, res, next) => {
  const { error } = forgotPasswordValidation(req.body);
  if (error) {
    const message = error.details.map(err => err.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }
  next();
}, forgotPassword);

router.post('/reset-password', (req, res, next) => {
  const { error } = resetPasswordValidation(req.body);
  if (error) {
    const message = error.details.map(err => err.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }
  next();
}, resetPassword);

router.post('/change-password', verifyToken, (req, res, next) => {
  const { error } = changePasswordValidation(req.body);
  if (error) {
    const message = error.details.map(err => err.message).join(', ');
    return res.status(400).json({
      success: false,
      message
    });
  }
  next();
}, changePassword);

module.exports = router;