const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.invoice.count();
  console.log('DATA_START');
  console.log(JSON.stringify({ count }, null, 2));
  console.log('DATA_END');
}

main().catch(console.error).finally(() => prisma.$disconnect());
