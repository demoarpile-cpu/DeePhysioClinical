const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

const registerUser = async (userData) => {
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
  return userWithoutPassword;
};

const loginUser = async (credentials) => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      allowed_menus: user.allowed_menus,
      allowed_permissions: getAssignedPermissions(user),
      effective_permissions: getEffectivePermissions(user),
      allowed_actions: getEffectiveAllowedActions(user)
    }
  };
};

const forgotPassword = async ({ email, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    const error = new Error('No account found with this email');
    error.statusCode = 404;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  return { email: user.email };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  return { id: user.id, email: user.email };
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  changePassword
};
