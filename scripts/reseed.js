const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default clinic users...');

  const users = [
    {
      name: 'User Administrator',
      email: 'admin@deephysio.com',
      password: 'admin123',
      role: 'admin'
    },
    {
      name: 'Mary Taylor',
      email: 'mary@deephysio.com',
      password: 'therapist123',
      role: 'therapist'
    },
    {
      name: 'Reception Desk',
      email: 'receptionist@deephysio.com',
      password: 'receptionist123',
      role: 'receptionist'
    }
  ];

  for (const u of users) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(u.password, salt);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role
      }
    });
    console.log(`- Created ${u.role}: ${u.email}`);
  }

  // Create a sample patient to test the list
  const patient = await prisma.patient.upsert({
    where: { phone: '07123456789' },
    update: {},
    create: {
      first_name: 'John',
      last_name: 'Doe',
      phone: '07123456789',
      email: 'john.doe@example.com',
      gender: 'male',
      date_of_birth: new Date('1985-05-15'),
      patient_type: 'Normal',
      behaviour: 'green'
    }
  });
  console.log('- Created sample patient: John Doe');

  // Create a sample waitlist entry
  await prisma.waitlist.upsert({
    where: { id: 1 },
    update: {},
    create: {
      patient_id: patient.id,
      first_name: 'Jane',
      last_name: 'Smith',
      service: 'Physio Evolution',
      contact_number: '07987654321',
      priority: 'HIGH',
      status: 'WAITING'
    }
  });
  console.log('- Created sample waitlist entry: Jane Smith');

  console.log('Seeding completed successfully.');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
