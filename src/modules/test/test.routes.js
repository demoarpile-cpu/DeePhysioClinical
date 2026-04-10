const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/auth.middleware');

/**
 * @route   GET /protected
 * @desc    Test protected route
 * @access  Private
 */
router.get('/protected', verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Access granted',
    user: req.user
  });
});

module.exports = router;
