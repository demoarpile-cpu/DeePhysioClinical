const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const { MODULES } = require('../../config/moduleAccess');
const {
  normalizePermissions,
  normalizeAllowedActions,
  getAssignedPermissions,
  getEffectivePermissions,
  getEffectiveAllowedActions,
  validatePermissionAssignment
} = require('../../config/actionAccess');

const normalizeAllowedMenus = (allowedMenus) => {
  if (!Array.isArray(allowedMenus)) return null;
  const unique = [...new Set(allowedMenus.filter((m) => MODULES.includes(m)))];
  return unique;
};

const buildPermissionBundle = ({ role, allowed_permissions, allowed_actions }) => {
  const normalizedPermissions = normalizePermissions(allowed_permissions);
  if (normalizedPermissions) {
    const validation = validatePermissionAssignment({ role, assignedPermissions: normalizedPermissions });
    if (!validation.valid) {
      const error = new Error(validation.message || 'Invalid permission assignment');
      error.statusCode = 400;
      throw error;
    }
    return {
      assignedPermissions: normalizedPermissions,
      effectivePermissions: getEffectivePermissions({ role, allowed_permissions: normalizedPermissions }),
      legacyActions: getEffectiveAllowedActions({ role, allowed_permissions: normalizedPermissions })
    };
  }

  const normalizedLegacy = normalizeAllowedActions(allowed_actions);
  const baseUserLike = normalizedLegacy
    ? { role, allowed_actions: normalizedLegacy }
    : { role };

  return {
    assignedPermissions: getAssignedPermissions(baseUserLike),
    effectivePermissions: getEffectivePermissions(baseUserLike),
    legacyActions: getEffectiveAllowedActions(baseUserLike)
  };
};

/**
 * Get all users excluding passwords
 * @returns {Array} List of users
 */
const getAllUsers = async () => {
  const users = await prisma.user.findMany();

  // Exclude password field from all users
  return users.map(user => {
    const { password, ...userWithoutPassword } = user;
    userWithoutPassword.allowed_permissions = getAssignedPermissions(userWithoutPassword);
    userWithoutPassword.effective_permissions = getEffectivePermissions(userWithoutPassword);
    userWithoutPassword.allowed_actions = getEffectiveAllowedActions(userWithoutPassword);
    return userWithoutPassword;
  });
};

/**
 * Create a new user
 * @param {Object} userData - User details (name, email, password, role)
 * @returns {Object} Created user without password
 */
const createUser = async (userData) => {
  const { name, email, password, role, allowed_menus, allowed_actions, allowed_permissions } = userData;
  const safeMenus = normalizeAllowedMenus(allowed_menus);
  const permissionBundle = buildPermissionBundle({ role, allowed_permissions, allowed_actions });

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      allowed_menus: safeMenus,
      allowed_permissions: permissionBundle.assignedPermissions,
      allowed_actions: permissionBundle.legacyActions
    }
  });

  const { password: _, ...userWithoutPassword } = user;
  userWithoutPassword.allowed_permissions = getAssignedPermissions(userWithoutPassword);
  userWithoutPassword.effective_permissions = getEffectivePermissions(userWithoutPassword);
  userWithoutPassword.allowed_actions = getEffectiveAllowedActions(userWithoutPassword);
  return userWithoutPassword;
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const { password, ...userWithoutPassword } = user;
  userWithoutPassword.allowed_permissions = getAssignedPermissions(userWithoutPassword);
  userWithoutPassword.effective_permissions = getEffectivePermissions(userWithoutPassword);
  userWithoutPassword.allowed_actions = getEffectiveAllowedActions(userWithoutPassword);
  return userWithoutPassword;
};

const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return await prisma.user.delete({ where: { id } });
};

const updateUser = async (id, data) => {
  const { password, allowed_menus, allowed_actions, allowed_permissions, ...updateData } = data;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  if (allowed_menus !== undefined) {
    updateData.allowed_menus = normalizeAllowedMenus(allowed_menus);
  }
  if (allowed_menus !== undefined || allowed_actions !== undefined || allowed_permissions !== undefined || data.role !== undefined) {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { role: true, allowed_menus: true, allowed_actions: true, allowed_permissions: true }
    });
    const roleForPermissions = String(updateData.role || existing?.role || '').toLowerCase();
    const sourcePermissions = allowed_permissions !== undefined
      ? allowed_permissions
      : existing?.allowed_permissions;
    const sourceLegacyActions = allowed_actions !== undefined
      ? allowed_actions
      : existing?.allowed_actions;
    const permissionBundle = buildPermissionBundle({
      role: roleForPermissions,
      allowed_permissions: sourcePermissions,
      allowed_actions: sourceLegacyActions
    });

    updateData.allowed_permissions = permissionBundle.assignedPermissions;
    updateData.allowed_actions = permissionBundle.legacyActions;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  });

  const { password: _, ...userWithoutPassword } = user;
  userWithoutPassword.allowed_permissions = getAssignedPermissions(userWithoutPassword);
  userWithoutPassword.effective_permissions = getEffectivePermissions(userWithoutPassword);
  userWithoutPassword.allowed_actions = getEffectiveAllowedActions(userWithoutPassword);
  return userWithoutPassword;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  updateUser
};
