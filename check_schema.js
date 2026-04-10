const prisma = require('./src/config/prisma');

async function testSchema() {
  try {
    const logs = await prisma.systemActivityLog.findMany({
      take: 1
    });
    console.log('Successfully queried logs. Meta field exists:', logs[0] && 'meta' in logs[0]);
  } catch (err) {
    console.error('Schema check failed:', err.message);
  } finally {
    process.exit(0);
  }
}

testSchema();
