const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Cleaning up database schema for plain_password removal...');
    // Drop the plain_password column from users table
    await prisma.$executeRawUnsafe('ALTER TABLE users DROP COLUMN IF EXISTS plain_password;');
    console.log('SUCCESS: plain_password column removed from users table.');
  } catch (error) {
    console.error('FAILED to remove column:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
