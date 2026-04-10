const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const users = [
  { name: 'Admin User', email: 'admin@deephysio.com', password: 'admin123', role: 'admin' },
  { name: 'Therapist User', email: 'therapist@deephysio.com', password: 'therapist123', role: 'therapist' },
  { name: 'Receptionist User', email: 'receptionist@deephysio.com', password: 'receptionist123', role: 'receptionist' },
  { name: 'Billing User', email: 'billing@deephysio.com', password: 'billing123', role: 'billing' }
];

async function main() {
  console.log('Seeding default users...');

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword,
        role: user.role,
        name: user.name
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role
      }
    });
    console.log(`User ${user.email} seeded/updated successfully.`);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
