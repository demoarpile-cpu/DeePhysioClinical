const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStarred() {
  try {
    const messages = await prisma.$queryRawUnsafe(`
      SELECT id, body, is_starred, is_deleted FROM communication_messages WHERE is_starred = 1 OR is_deleted = 1
    `);
    console.log('Starred/Deleted Messages in DB:');
    console.log(messages);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkStarred();
