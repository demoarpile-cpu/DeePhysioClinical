const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const patient = await prisma.patient.findFirst({
    where: { first_name: 'dj', last_name: 'don' }
  });
  
  if (!patient) return;

  const payment = await prisma.payment.findFirst({
    where: { patient_id: patient.id, invoice_id: null, amount: { gte: 898, lte: 899 } }
  });

  if (!payment) {
    console.log('Bulk payment for DJ don not found or already linked');
    return;
  }

  const pendingInvoices = await prisma.invoice.findMany({
    where: { patient_id: patient.id, status: 'PENDING' },
    orderBy: { date: 'asc' }
  });

  console.log(`Found bulk payment £${payment.amount} and ${pendingInvoices.length} pending invoices.`);

  let remaining = parseFloat(payment.amount);
  
  for (let i = 0; i < pendingInvoices.length; i++) {
    const inv = pendingInvoices[i];
    const invTotal = parseFloat(inv.total);
    
    if (remaining >= invTotal - 0.01) {
      if (i === 0) {
        // Link the existing payment record to the first invoice
        await prisma.payment.update({
          where: { id: payment.id },
          data: { invoice_id: inv.id, amount: invTotal }
        });
      } else {
        // Create new payment records for subsequent invoices (splitting the bulk payment)
        await prisma.payment.create({
          data: {
            patient_id: patient.id,
            invoice_id: inv.id,
            amount: invTotal,
            date: payment.date,
            method: payment.method,
            status: 'COMPLETED',
            description: `Split from bulk payment £${payment.amount}`
          }
        });
      }
      
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: 'PAID' }
      });
      
      remaining -= invTotal;
      console.log(`Linked and Paid: ${inv.id} (£${invTotal})`);
    }
  }
  
  if (remaining > 0.01) {
    console.log(`Remaining balance after distribution: £${remaining}`);
    // If there's leftover, we could create an unlinked payment or update the last record
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
