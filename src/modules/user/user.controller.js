const userService = require('./user.service');
const { logActivity } = require('../../utils/activityLogger');

/**
 * Get all users
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getMe = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const user = await userService.getUserById(id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create a new user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await userService.getUserById(id);

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    await logActivity(
      req.user?.id,
      'UPDATE_SETTINGS',
      user.id,
      'User',
      `create_user: ${user.email}`,
      { action: 'create_user', entity: 'User', entityId: user.id, role: user.role }
    );

    return res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await userService.deleteUser(id);
    await logActivity(
      req.user?.id,
      'UPDATE_SETTINGS',
      id,
      'User',
      `delete_user: ${id}`,
      { action: 'delete_user', entity: 'User', entityId: id }
    );
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, message: e.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await userService.updateUser(id, req.body);
    const hasPermissionChange = Object.prototype.hasOwnProperty.call(req.body, 'allowed_permissions')
      || Object.prototype.hasOwnProperty.call(req.body, 'allowed_actions')
      || Object.prototype.hasOwnProperty.call(req.body, 'role');
    await logActivity(
      req.user?.id,
      'UPDATE_SETTINGS',
      id,
      'User',
      hasPermissionChange ? `update_user_permissions: ${user.email}` : `update_user: ${user.email}`,
      {
        action: hasPermissionChange ? 'update_user_permissions' : 'update_user',
        entity: 'User',
        entityId: id
      }
    );
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, message: e.message });
  }
};

module.exports = {
  getMe,
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  updateUser
};
