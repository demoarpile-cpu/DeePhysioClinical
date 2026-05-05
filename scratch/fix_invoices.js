const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInvoices() {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'PENDING' },
    include: { payments: true }
  });

  let fixedCount = 0;
  for (const invoice of invoices) {
    const totalPaid = invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalDue = parseFloat(invoice.total || 0);

    if (totalPaid >= totalDue - 0.01) {
      console.log(`Fixing Invoice ${invoice.id} - Paid: ${totalPaid}, Due: ${totalDue}`);
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID' }
      });
      fixedCount++;
    }
  }

  // Also, find orphaned payments (where invoice_id is null)
  // and see if we can link them to pending invoices for the same patient
  const orphanedPayments = await prisma.payment.findMany({
    where: { invoice_id: null }
  });

  for (const payment of orphanedPayments) {
    const pendingInvoices = await prisma.invoice.findMany({
      where: { patient_id: payment.patient_id, status: 'PENDING' },
      orderBy: { date: 'asc' }
    });

    let remainingPayment = parseFloat(payment.amount);
    if (pendingInvoices.length > 0 && remainingPayment > 0) {
      console.log(`Linking orphaned payment ${payment.id} for patient ${payment.patient_id} amount ${payment.amount}`);
      
      const inv = pendingInvoices[0]; // Just link to the first one for simplicity
      await prisma.payment.update({
        where: { id: payment.id },
        data: { invoice_id: inv.id }
      });
      
      // Re-check invoice
      const updatedInv = await prisma.invoice.findUnique({ where: { id: inv.id }, include: { payments: true }});
      const tPaid = updatedInv.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const tDue = parseFloat(updatedInv.total || 0);
      if (tPaid >= tDue - 0.01) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: 'PAID' }
        });
        console.log(`Fixed Invoice ${inv.id} after linking`);
        fixedCount++;
      }
    }
  }

  console.log(`Finished fixing invoices. Fixed ${fixedCount} invoices.`);
}

fixInvoices()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
