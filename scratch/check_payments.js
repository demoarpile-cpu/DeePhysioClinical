const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const payments = await prisma.payment.findMany({
    include: {
      invoice: true,
      patient: { select: { first_name: true, last_name: true } }
    }
  });
  console.log('--- ALL PAYMENTS ---');
  payments.forEach(p => {
    console.log(`ID: ${p.id}, Amount: £${p.amount}, Date: ${p.date}, Method: ${p.method}, Invoice ID: ${p.invoice_id}, Status: ${p.invoice?.status}, Patient: ${p.patient?.first_name} ${p.patient?.last_name}`);
  });
  
  const totalPaymentAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  console.log('--- TOTAL PAYMENTS RECORDED ---');
  console.log('Total:', totalPaymentAmount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
