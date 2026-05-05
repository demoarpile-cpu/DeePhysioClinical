const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the patient "testing first"
  const patient = await prisma.patient.findFirst({
    where: { first_name: 'testing', last_name: 'first' }
  });
  
  if (!patient) {
    console.log('Patient not found');
    return;
  }
  
  console.log('Patient ID:', patient.id);
  
  // Find the pending invoice for this patient with amount ~501.6
  const invoice = await prisma.invoice.findFirst({
    where: { 
      patient_id: patient.id,
      status: 'PENDING',
      total: { gte: 501, lte: 502 }
    }
  });
  
  if (!invoice) {
    console.log('Invoice not found');
  } else {
    console.log('Invoice found:', invoice.id, 'Total:', invoice.total);
  }
  
  // Find the unlinked payment for this patient with amount ~501.6
  const payment = await prisma.payment.findFirst({
    where: {
      patient_id: patient.id,
      invoice_id: null,
      amount: { gte: 501, lte: 502 }
    }
  });
  
  if (!payment) {
    console.log('Payment not found');
  } else {
    console.log('Payment found:', payment.id, 'Amount:', payment.amount);
  }
  
  if (invoice && payment) {
    console.log('Linking payment to invoice and marking as PAID...');
    await prisma.payment.update({
      where: { id: payment.id },
      data: { invoice_id: invoice.id }
    });
    
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' }
    });
    console.log('Success!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
