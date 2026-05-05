const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'PAID' },
    select: { total: true }
  });
  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
  console.log('Total PAID Revenue:', totalRevenue);
  
  const allInvoices = await prisma.invoice.findMany({
    select: { total: true, status: true }
  });
  console.log('All Invoices:', allInvoices);
}

main().catch(console.error).finally(() => prisma.$disconnect());
