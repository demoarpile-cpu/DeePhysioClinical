const prisma = require('../../config/prisma');
const { ROLE_DEFAULTS } = require('../../config/moduleAccess');
const { getEffectivePermissions } = require('../../config/actionAccess');
const { logActivity } = require('../../utils/activityLogger');

const MODULE_ALIASES = {
  'Billing & Payments': 'Billing'
};

const MODULE_PERMISSION_FALLBACK = {
  Patients: ['patient.basic', 'patient.read', 'patient.write', 'patient.delete'],
  Appointments: ['appointments.view', 'appointments.manage'],
  'Clinical Notes': ['notes.view', 'notes.manage'],
  Communication: ['communication.use'],
  Billing: ['billing.view', 'billing.manage'],
  Forms: ['forms.manage'],
  Analytics: ['analytics.view'],
  Settings: ['settings.manage', 'users.manage']
};

const SAFE_FALLBACK_PATTERNS = [
  /^\/api\/patients(?:\/search)?(?:\?.*)?$/i,
  /^\/api\/appointments\/practitioners(?:\?.*)?$/i,
  /^\/api\/services(?:\?.*)?$/i
];

const isSafeFallbackRequest = (req) => {
  if ((req.method || '').toUpperCase() !== 'GET') return false;
  const path = req.originalUrl || req.path || '';
  return SAFE_FALLBACK_PATTERNS.some((pattern) => pattern.test(path));
};

const normalizeModuleName = (moduleName) => MODULE_ALIASES[moduleName] || moduleName;

const requireModuleAccess = (moduleName) => {
  const requestedModules = Array.isArray(moduleName) ? moduleName : [moduleName];
  const normalizedRequestedModules = requestedModules.map(normalizeModuleName);

  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, allowed_menus: true, allowed_permissions: true, allowed_actions: true }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const rawMenus = Array.isArray(user.allowed_menus) ? user.allowed_menus : (ROLE_DEFAULTS[user.role] || []);
      const normalizedMenus = rawMenus.map(normalizeModuleName);

      const effectivePermissions = getEffectivePermissions(user);
      const hasPermissionFallback = isSafeFallbackRequest(req) && normalizedRequestedModules.some((menu) => {
        const requiredPermissions = MODULE_PERMISSION_FALLBACK[menu] || [];
        return requiredPermissions.some((perm) => effectivePermissions.includes(perm));
      });

      const hasAnyAccess = normalizedRequestedModules.some((menu) => normalizedMenus.includes(menu)) || hasPermissionFallback;
      if (!hasAnyAccess) {
        await logActivity(
          req.user?.id,
          'UPDATE_SETTINGS',
          null,
          'Authorization',
          `Unauthorized module access attempt: ${req.method} ${req.originalUrl}`,
          { action: 'unauthorized_module_access', method: req.method, path: req.originalUrl, modules: normalizedRequestedModules }
        );
        return res.status(403).json({
          success: false,
          message: `Forbidden: No access to ${normalizedRequestedModules.join(' or ')}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify module access'
      });
    }
  };
};

module.exports = {
  requireModuleAccess
};
