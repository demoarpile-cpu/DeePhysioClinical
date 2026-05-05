const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING GLOBAL PAYMENT-INVOICE SYNC ---');
  
  // 1. Find all unlinked payments
  const unlinkedPayments = await prisma.payment.findMany({
    where: { invoice_id: null }
  });
  
  console.log(`Found ${unlinkedPayments.length} unlinked payments.`);
  
  let syncCount = 0;
  
  for (const payment of unlinkedPayments) {
    // Look for a pending invoice for the same patient that matches the payment amount
    // Or if multiple payments exist, we should check the total
    const invoice = await prisma.invoice.findFirst({
      where: {
        patient_id: payment.patient_id,
        status: 'PENDING',
        total: { gte: parseFloat(payment.amount) - 0.01, lte: parseFloat(payment.amount) + 0.01 }
      }
    });
    
    if (invoice) {
      console.log(`Matching Payment £${payment.amount} to Invoice ${invoice.id} for Patient ${payment.patient_id}`);
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { invoice_id: invoice.id }
      });
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID' }
      });
      
      syncCount++;
    }
  }
  
  console.log(`--- SYNC COMPLETE. Linked ${syncCount} payments to invoices. ---`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
