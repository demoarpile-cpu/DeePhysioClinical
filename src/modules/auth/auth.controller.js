const authService = require('./auth.service');
const { logActivity } = require('../../utils/activityLogger');

const registerUser = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);

    return res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);

    await logActivity(
      result.user.id, 
      'LOGIN', 
      result.user.id, 
      'User', 
      `User ${result.user.name} logged in`,
      { entity: 'User', entityId: result.user.id, label: result.user.name }
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await authService.changePassword(userId, req.body);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Password changed successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  changePassword
};