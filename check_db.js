const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const userCount = await prisma.user.count();
    const patientCount = await prisma.patient.count();
    const taskCount = await prisma.task.count();
    
    console.log(`Users: ${userCount}`);
    console.log(`Patients: ${patientCount}`);
    console.log(`Tasks: ${taskCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({ select: { email: true, role: true } });
      console.log('Current Users:', JSON.stringify(users, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking DB:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
