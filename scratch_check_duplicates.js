const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkThreads() {
  try {
    const threads = await prisma.$queryRawUnsafe(`
      SELECT id, patient_id, channel, title FROM communication_threads WHERE channel = 'email'
    `);
    console.log('Email Threads:');
    console.log(threads);

    const messages = await prisma.$queryRawUnsafe(`
      SELECT id, thread_id, body FROM communication_messages WHERE channel = 'email'
    `);
    console.log('\nEmail Messages:');
    console.log(messages);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkThreads();
