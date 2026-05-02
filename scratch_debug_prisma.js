const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrisma() {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM communication_messages LIMIT 5');
    console.log('Prisma Raw Rows:');
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrisma();
