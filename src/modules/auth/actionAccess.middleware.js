const prisma = require('../../config/prisma');
const { getEffectivePermissions, getEffectiveAllowedActions } = require('../../config/actionAccess');
const { logActivity } = require('../../utils/activityLogger');

const loadUserAccess = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    select: { role: true, allowed_permissions: true, allowed_actions: true }
  });
  if (!user) return null;

  // Parse JSON strings from DB if necessary
  const fields = ['allowed_permissions', 'allowed_actions'];
  fields.forEach(field => {
    if (typeof user[field] === 'string' && user[field].startsWith('[')) {
      try {
        user[field] = JSON.parse(user[field]);
      } catch (e) {
        user[field] = [];
      }
    }
  });

  return {
    user,
    effectivePermissions: getEffectivePermissions(user),
    effectiveLegacyActions: getEffectiveAllowedActions(user)
  };
};

const requireActionAccess = (actionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const access = await loadUserAccess(req.user.id);
      if (!access) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const isAllowed = access.effectivePermissions.includes(actionKey) || access.effectiveLegacyActions.includes(actionKey);
      if (!isAllowed) {
        await logActivity(
          req.user?.id,
          'UPDATE_SETTINGS',
          null,
          'Authorization',
          `Unauthorized permission attempt: ${actionKey}`,
          { action: 'unauthorized_permission_access', permission: actionKey, method: req.method, path: req.originalUrl }
        );
        return res.status(403).json({
          success: false,
          message: `Forbidden: Missing permission ${actionKey}`
        });
      }

      req.authz = {
        effectivePermissions: access.effectivePermissions,
        effectiveLegacyActions: access.effectiveLegacyActions
      };
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify action access'
      });
    }
  };
};

const requireAnyActionAccess = (...actionKeys) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const access = await loadUserAccess(req.user.id);
      if (!access) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const isAllowed = actionKeys.some((key) =>
        access.effectivePermissions.includes(key) || access.effectiveLegacyActions.includes(key)
      );
      if (!isAllowed) {
        await logActivity(
          req.user?.id,
          'UPDATE_SETTINGS',
          null,
          'Authorization',
          `Unauthorized permission attempt: ${actionKeys.join(', ')}`,
          { action: 'unauthorized_permission_access_any', permissions: actionKeys, method: req.method, path: req.originalUrl }
        );
        return res.status(403).json({
          success: false,
          message: `Forbidden: Missing one of ${actionKeys.join(', ')}`
        });
      }
      req.authz = {
        effectivePermissions: access.effectivePermissions,
        effectiveLegacyActions: access.effectiveLegacyActions
      };
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to verify action access' });
    }
  };
};

module.exports = {
  requireActionAccess,
  requireAnyActionAccess,
  requirePermission: requireActionAccess,
  requirePermissionAny: requireAnyActionAccess
};
