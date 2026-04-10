const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Normalizing Invoice Statuses...');
  
  const invoices = await prisma.invoice.findMany();
  for (const inv of invoices) {
    let newStatus = 'PENDING';
    const s = inv.status.toLowerCase();
    if (s === 'paid' || s === 'completed') newStatus = 'PAID';
    else if (s === 'cancelled' || s === 'void') newStatus = 'CANCELLED';
    else if (s === 'overdue') newStatus = 'OVERDUE';
    
    if (inv.status !== newStatus) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: newStatus }
      });
      console.log(`Updated Invoice ${inv.id}: ${inv.status} -> ${newStatus}`);
    }
  }

  console.log('Normalizing Payment Statuses...');
  const payments = await prisma.payment.findMany();
  for (const pay of payments) {
    let newStatus = 'PENDING';
    if (!pay.status) newStatus = 'PENDING';
    else {
      const s = pay.status.toLowerCase();
      if (s === 'paid' || s === 'completed' || s === 'success') newStatus = 'COMPLETED';
      else if (s === 'failed') newStatus = 'FAILED';
      else if (s === 'refunded') newStatus = 'REFUNDED';
    }

    if (pay.status !== newStatus) {
      await prisma.payment.update({
        where: { id: pay.id },
        data: { status: newStatus }
      });
      console.log(`Updated Payment ${pay.id}: ${pay.status} -> ${newStatus}`);
    }
  }

  console.log('Normalization Complete.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
