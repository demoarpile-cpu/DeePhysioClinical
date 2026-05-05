const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const patient = await prisma.patient.findFirst({
    where: { first_name: 'dj', last_name: 'don' }
  });
  
  if (!patient) {
    console.log('Patient "dj don" not found');
    return;
  }
  
  console.log('Patient ID:', patient.id);
  
  const invoices = await prisma.invoice.findMany({
    where: { patient_id: patient.id },
    include: { payments: true }
  });
  
  const payments = await prisma.payment.findMany({
    where: { patient_id: patient.id }
  });
  
  console.log('--- INVOICES ---');
  invoices.forEach(inv => {
    console.log(`ID: ${inv.id}, Total: £${inv.total}, Status: ${inv.status}, Payments Linked: ${inv.payments.length}`);
  });
  
  console.log('--- PAYMENTS ---');
  payments.forEach(pay => {
    console.log(`ID: ${pay.id}, Amount: £${pay.amount}, Date: ${pay.date}, Invoice ID: ${pay.invoice_id}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
