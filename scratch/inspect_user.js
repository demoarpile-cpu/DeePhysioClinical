const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getEffectivePermissions } = require('../src/config/actionAccess');

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 3 },
    select: { id: true, email: true, role: true, allowed_permissions: true, allowed_actions: true }
  });
  
  if (user && typeof user.allowed_permissions === 'string') {
    user.allowed_permissions = JSON.parse(user.allowed_permissions);
  }
  
  const effective = getEffectivePermissions(user);
  
  console.log('USER_DATA_START');
  console.log(JSON.stringify({ user, effective }, null, 2));
  console.log('USER_DATA_END');
}

main().catch(console.error).finally(() => prisma.$disconnect());
