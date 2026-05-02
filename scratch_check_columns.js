const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    const columns = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM communication_messages');
    console.log(columns);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
