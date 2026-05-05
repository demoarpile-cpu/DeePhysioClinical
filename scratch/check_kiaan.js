const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkKiaan() {
  const patient = await prisma.patient.findFirst({
    where: { first_name: { contains: 'kiaan' } }
  });

  if (!patient) {
    console.log('Kiaan not found');
    return;
  }
  
  console.log(`Found patient: ${patient.id} - ${patient.first_name} ${patient.last_name}`);
  
  const invoices = await prisma.invoice.findMany({
    where: { patient_id: patient.id }
  });
  console.log('Invoices:', invoices.map(i => ({id: i.id, total: i.total.toString(), status: i.status})));

  const payments = await prisma.payment.findMany({
    where: { patient_id: patient.id }
  });
  console.log('Payments:', payments.map(p => ({id: p.id, invoice_id: p.invoice_id, amount: p.amount.toString(), status: p.status})));
}

checkKiaan()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
