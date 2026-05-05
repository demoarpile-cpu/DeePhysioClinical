const prisma = require('../../config/prisma');

const getAllPayments = async (filters) => {
  const { patientId, invoiceId, startDate, endDate } = filters;
  const where = {};

  if (patientId) where.patient_id = parseInt(patientId, 10);
  if (invoiceId) where.invoice_id = invoiceId;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  return await prisma.payment.findMany({
    where,
    include: {
      patient: { select: { id: true, first_name: true, last_name: true, patient_type: true } },
      invoice: true
    },
    orderBy: { created_at: 'desc' }
  });
};

const getPaymentById = async (id) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } },
      invoice: true
    }
  });

  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  return payment;
};

const createPayment = async (data) => {
  let { patient_id, invoice_id, amount, date, method, status, description } = data;
  const totalAmount = parseFloat(amount);
  const patientId = parseInt(patient_id, 10);

  // --- SMART BULK LINKING ---
  if (!invoice_id) {
    const pendingInvoices = await prisma.invoice.findMany({
      where: { patient_id: patientId, status: 'PENDING' },
      orderBy: { date: 'asc' }
    });

    let remainingAmount = totalAmount;
    let firstInvoiceId = null;

    // We will create multiple payment records if this is a bulk payment covering multiple invoices
    for (const inv of pendingInvoices) {
      const invTotal = parseFloat(inv.total);
      if (remainingAmount >= invTotal - 0.01) {
        // This invoice is fully covered
        if (!firstInvoiceId) {
          // First one will use the main request logic (updated below)
          firstInvoiceId = inv.id;
          remainingAmount -= invTotal;
        } else {
          // Create additional payment records for other invoices
          await prisma.payment.create({
            data: {
              patient_id: patientId,
              invoice_id: inv.id,
              amount: invTotal,
              date: new Date(date),
              method,
              status: 'COMPLETED',
              description: `Bulk payment part (Total: £${totalAmount})`
            }
          });
          await prisma.invoice.update({
            where: { id: inv.id },
            data: { status: 'PAID' }
          });
          remainingAmount -= invTotal;
        }
      } else if (remainingAmount > 0) {
        // Partial coverage for this invoice (optional: link whatever is left)
        // For now, let's just stop or link the remainder to the next one
        if (!firstInvoiceId) firstInvoiceId = inv.id;
        break;
      }
    }
    
    if (firstInvoiceId) {
      invoice_id = firstInvoiceId;
      amount = totalAmount - remainingAmount; // Amount for the first linked invoice
      if (remainingAmount > 0 && pendingInvoices.length > 0) {
        // If there's leftover after covering some invoices, or it was just a partial payment
        amount = totalAmount; // Actually let's just use the original logic if it didn't cover fully or we want to keep it simple
      }
      
      // Wait, let's keep it simple: if we found a first invoice, use its amount for the first record
      // and let the loop handle the rest.
      // Adjusting 'amount' for the first record created by the main prisma.create call below
      if (totalAmount !== remainingAmount) {
         // This was a bulk payment that covered at least one full invoice
         amount = totalAmount - (totalAmount - (parseFloat(pendingInvoices.find(i => i.id === firstInvoiceId).total)));
      }
    }
  }

  // Final payment record creation
  const payment = await prisma.payment.create({
    data: {
      patient_id: patientId,
      invoice_id,
      amount: parseFloat(amount),
      date: new Date(date),
      method,
      status: status || 'COMPLETED',
      description
    },
    include: {
      patient: true,
      invoice: true
    }
  });

  if (invoice_id) {
    await syncInvoiceStatus(invoice_id);
  }

  return payment;
};

/**
 * Helper to update invoice status based on payment totals
 */
const syncInvoiceStatus = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true }
  });

  if (!invoice) return;

  const totalPaid = invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalDue = parseFloat(invoice.total || 0);

  if (totalPaid >= totalDue - 0.01) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' }
    });
    
    // Log activity
    await prisma.systemActivityLog.create({
      data: {
        action: 'PAY_INVOICE',
        target_id: invoiceId,
        target_type: 'Invoice',
        details: `Invoice fully paid: £${totalPaid}`,
        meta: JSON.stringify({ amount: totalPaid })
      }
    });
  }
};

const deletePayment = async (id) => {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.payment.delete({ where: { id } });
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  deletePayment
};
