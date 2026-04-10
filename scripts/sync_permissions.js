const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROLE_DEFAULT_PERMISSIONS = {
  therapist: ['patient.read', 'patient.write', 'appointments.manage', 'notes.manage', 'analytics.view'],
  receptionist: ['patient.basic', 'appointments.manage', 'billing.view', 'analytics.view'],
  billing: ['patient.basic', 'billing.manage', 'analytics.view']
};

async function syncDefaults() {
  console.log('Syncing default permissions for existing users...');
  
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    if (user.role === 'admin') continue;
    
    const defaults = ROLE_DEFAULT_PERMISSIONS[user.role.toLowerCase()];
    if (!defaults) continue;
    
    // Merge existing permissions with defaults to ensure analytics.view is included
    const current = Array.isArray(user.allowed_permissions) ? user.allowed_permissions : [];
    const missing = defaults.filter(p => !current.includes(p));
    
    if (missing.length > 0) {
      console.log(`Updating ${user.email} (${user.role}): adding ${missing.join(', ')}`);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          allowed_permissions: [...new Set([...current, ...missing])]
        }
      });
    }
  }
  
  console.log('Done!');
  await prisma.$disconnect();
}

syncDefaults().catch(e => {
  console.error(e);
  process.exit(1);
});
