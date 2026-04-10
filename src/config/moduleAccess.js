const MODULES = [
  'Dashboard',
  'Appointments',
  'Patients',
  'Clinical Notes',
  'Communication',
  'Billing',
  'Forms',
  'Analytics',
  'Settings'
];

const ROLE_DEFAULTS = {
  admin: MODULES,
  therapist: [
    'Dashboard',
    'Appointments',
    'Patients',
    'Clinical Notes',
    'Communication',
    'Forms',
    'Analytics',
    'Settings'
  ],
  receptionist: [
    'Dashboard',
    'Appointments',
    'Patients',
    'Communication',
    'Forms',
    'Analytics',
    'Settings'
  ],
  billing: ['Dashboard', 'Billing', 'Analytics', 'Communication', 'Settings']
};

module.exports = {
  MODULES,
  ROLE_DEFAULTS
};
