const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMessages() {
  try {
    const counts = await prisma.$queryRawUnsafe(`
      SELECT direction, COUNT(*) as count 
      FROM communication_messages 
      GROUP BY direction
    `);
    console.log('Message Direction Counts:');
    console.log(counts);

    const allMessages = await prisma.$queryRawUnsafe(`
      SELECT id, direction, channel, body FROM communication_messages LIMIT 10
    `);
    console.log('\nSample Messages:');
    console.log(allMessages);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkMessages();
