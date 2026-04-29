const PERMISSIONS = [
  'patient.basic',
  'patient.read',
  'patient.write',
  'patient.delete',
  'user.basic',
  'user.read',
  'user.write',
  'appointments.view',
  'appointments.manage',
  'notes.view',
  'notes.manage',
  'billing.view',
  'billing.manage',
  'communication.use',
  'forms.view',
  'forms.manage',
  'users.manage',
  'settings.manage',
  'analytics.view'
];

const ROLE_DEFAULT_PERMISSIONS = {
  admin: PERMISSIONS,
  therapist: [
    'patient.read',
    'patient.write',
    'appointments.manage',
    'notes.manage',
    'forms.view',
    'analytics.view'
  ],
  receptionist: [
    'patient.basic',
    'patient.write',
    'appointments.manage',
    'billing.view',
    'forms.manage',
    'analytics.view'
  ],
  billing: [
    'patient.basic',
    'billing.manage',
    'analytics.view'
  ]
};

const DEPENDENCY_RULES = [
  { whenAny: ['appointments.view', 'appointments.manage'], add: ['patient.basic'] },
  { whenAny: ['notes.view', 'notes.manage'], add: ['patient.read'], allowedRoles: ['admin', 'therapist'] },
  { whenAny: ['billing.view', 'billing.manage'], add: ['patient.basic'] },
  { whenAny: ['communication.use'], add: ['patient.basic'] }
];

const LEGACY_ACTIONS = [
  'patients.view',
  'patients.create',
  'patients.edit',
  'patients.delete',
  'patients.view_notes',
  'appointments.view',
  'appointments.book',
  'appointments.reschedule',
  'appointments.checkin',
  'appointments.complete',
  'appointments.cancel',
  'notes.view',
  'notes.create',
  'notes.edit',
  'notes.delete',
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'users.assign_permissions'
];

const PERMISSION_TO_LEGACY = {
  'patient.basic': ['patients.view'],
  'patient.read': ['patients.view', 'patients.view_notes'],
  'patient.write': ['patients.create', 'patients.edit'],
  'patient.delete': ['patients.delete'],
  'appointments.view': ['appointments.view'],
  'appointments.manage': ['appointments.book', 'appointments.reschedule', 'appointments.checkin', 'appointments.complete', 'appointments.cancel'],
  'notes.view': ['notes.view'],
  'notes.manage': ['notes.create', 'notes.edit', 'notes.delete'],
  'users.manage': ['users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_permissions'],
  'settings.manage': ['users.view'],
  'analytics.view': []
};

const LEGACY_TO_PERMISSION = {
  'patients.view': 'patient.basic',
  'patients.view_notes': 'notes.view',
  'patients.create': 'patient.write',
  'patients.edit': 'patient.write',
  'patients.delete': 'patient.delete',
  'appointments.view': 'appointments.view',
  'appointments.book': 'appointments.manage',
  'appointments.reschedule': 'appointments.manage',
  'appointments.checkin': 'appointments.manage',
  'appointments.complete': 'appointments.manage',
  'appointments.cancel': 'appointments.manage',
  'notes.view': 'notes.view',
  'notes.create': 'notes.manage',
  'notes.edit': 'notes.manage',
  'notes.delete': 'notes.manage',
  'users.view': 'users.manage',
  'users.create': 'users.manage',
  'users.edit': 'users.manage',
  'users.delete': 'users.manage',
  'users.assign_permissions': 'users.manage'
};

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return null;
  return [...new Set(permissions.filter((p) => PERMISSIONS.includes(p)))];
};

const normalizeAllowedActions = (allowedActions) => {
  if (!Array.isArray(allowedActions)) return null;
  return [...new Set(allowedActions.filter((a) => LEGACY_ACTIONS.includes(a)))];
};

const inferPermissionsFromLegacy = (legacyActions = []) => {
  const set = new Set();
  legacyActions.forEach((action) => {
    const mapped = LEGACY_TO_PERMISSION[action];
    if (mapped) set.add(mapped);
  });
  return [...set];
};

const resolvePermissions = (assignedPermissions = [], role = '') => {
  const resolved = new Set(assignedPermissions);
  const normalizedRole = String(role || '').toLowerCase();

  if (resolved.has('appointments.manage')) resolved.add('appointments.view');
  if (resolved.has('notes.manage')) resolved.add('notes.view');
  if (resolved.has('billing.manage')) resolved.add('billing.view');
  if (resolved.has('forms.manage')) resolved.add('forms.view');
  if (resolved.has('patient.read')) resolved.add('patient.basic');
  if (resolved.has('users.manage')) {
    resolved.add('user.read');
    resolved.add('user.write');
    resolved.add('user.basic');
  }
  if (resolved.has('settings.manage')) resolved.add('user.read');
  if (resolved.has('analytics.view')) {
    resolved.add('appointments.view');
    resolved.add('notes.view');
    resolved.add('billing.view');
    resolved.add('patient.basic');
  }

  DEPENDENCY_RULES.forEach((rule) => {
    if (Array.isArray(rule.allowedRoles) && !rule.allowedRoles.includes(normalizedRole)) return;
    if (rule.whenAny.some((perm) => resolved.has(perm))) {
      rule.add.forEach((dep) => resolved.add(dep));
    }
  });

  return [...resolved];
};

const getAssignedPermissions = (userLike = {}) => {
  const explicitPermissions = normalizePermissions(userLike.allowed_permissions);
  if (explicitPermissions) return explicitPermissions;

  const explicitLegacy = normalizeAllowedActions(userLike.allowed_actions);
  if (explicitLegacy) return inferPermissionsFromLegacy(explicitLegacy);

  const role = String(userLike.role || '').toLowerCase();
  return ROLE_DEFAULT_PERMISSIONS[role] || [];
};

const getEffectivePermissions = (userLike = {}) => resolvePermissions(getAssignedPermissions(userLike), userLike.role);

const validatePermissionAssignment = ({ role = '', assignedPermissions = [] }) => {
  const normalizedRole = String(role || '').toLowerCase();
  const normalizedAssigned = normalizePermissions(assignedPermissions);
  if (!normalizedAssigned) {
    return { valid: false, message: 'Invalid permissions payload' };
  }

  // Guard sensitive capabilities from being assigned to incompatible roles.
  if (normalizedAssigned.includes('notes.manage') && !['admin', 'therapist'].includes(normalizedRole)) {
    return { valid: false, message: 'notes.manage is restricted to admin/therapist roles' };
  }
  if (normalizedAssigned.includes('notes.view') && !['admin', 'therapist'].includes(normalizedRole)) {
    return { valid: false, message: 'notes.view is restricted to admin/therapist roles' };
  }

  const resolved = resolvePermissions(normalizedAssigned, normalizedRole);
  if (normalizedAssigned.includes('appointments.view') && !resolved.includes('patient.basic')) {
    return { valid: false, message: 'appointments.view requires patient.basic dependency' };
  }

  return { valid: true, resolved };
};

const toLegacyActions = (permissions = []) => {
  const set = new Set();
  permissions.forEach((perm) => {
    (PERMISSION_TO_LEGACY[perm] || []).forEach((legacy) => set.add(legacy));
  });
  return [...set];
};

const getEffectiveAllowedActions = (userLike = {}) => {
  const effectivePermissions = getEffectivePermissions(userLike);
  return toLegacyActions(effectivePermissions);
};

module.exports = {
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  DEPENDENCY_RULES,
  LEGACY_ACTIONS,
  normalizePermissions,
  normalizeAllowedActions,
  inferPermissionsFromLegacy,
  resolvePermissions,
  getAssignedPermissions,
  getEffectivePermissions,
  validatePermissionAssignment,
  toLegacyActions,
  getEffectiveAllowedActions
};
