const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPatient() {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: 1 },
      include: {
        medical_history: true,
        emergency_contacts: true
      }
    });
    console.log('Patient 1 Data:', JSON.stringify(patient, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error checking patient:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkPatient();
