const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const users = [
  { name: 'Admin User', email: 'admin@deephysio.com', password: 'admin123', role: 'admin' },
  { name: 'Therapist User', email: 'therapist@deephysio.com', password: 'therapist123', role: 'therapist' },
  { name: 'Receptionist User', email: 'receptionist@deephysio.com', password: 'receptionist123', role: 'receptionist' },
  { name: 'Billing User', email: 'billing@deephysio.com', password: 'billing123', role: 'billing' }
];

const patients = [
  { first_name: 'Amy', last_name: 'Fowler', phone: '9876543210', email: 'amy@test.com', gender: 'female', patient_type: 'Normal', behaviour: 'green' },
  { first_name: 'John', last_name: 'Doe', phone: '1234567890', email: 'john@test.com', gender: 'male', patient_type: 'Normal', behaviour: 'green' },
  { first_name: 'Jane', last_name: 'Smith', phone: '5554443332', email: 'jane@test.com', gender: 'female', patient_type: 'Corporate', behaviour: 'yellow' }
];

async function main() {
  console.log('Restoring data...');

  // 1. Seed Users
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { password: hashedPassword, role: user.role, name: user.name },
      create: { name: user.name, email: user.email, password: hashedPassword, role: user.role }
    });
    console.log(`User ${user.email} restored.`);
  }

  // 2. Seed Patients
  for (const patient of patients) {
    await prisma.patient.upsert({
      where: { phone: patient.phone },
      update: patient,
      create: patient
    });
    console.log(`Patient ${patient.first_name} ${patient.last_name} restored.`);
  }

  console.log('Restoration completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
