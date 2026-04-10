const prisma = require('../../config/prisma');

const getAllInvoices = async (filters) => {
  const { status, patientId } = filters;
  const where = {};

  if (status) where.status = status;
  if (patientId) where.patient_id = parseInt(patientId, 10);

  return await prisma.invoice.findMany({
    where,
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } },
      items: true,
      payments: true
    },
    orderBy: { date: 'desc' }
  });
};

const getInvoiceById = async (id) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } },
      items: true,
      payments: true
    }
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  return invoice;
};

const getInvoiceDownloadPayload = async (id) => {
  const invoice = await getInvoiceById(id);
  return {
    id: invoice.id,
    patient: invoice.patient,
    date: invoice.date,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    status: invoice.status,
    notes: invoice.notes,
    items: invoice.items || [],
    payments: invoice.payments || [],
    generated_at: new Date().toISOString()
  };
};

const createInvoice = async (data) => {
  const { patientId, date, items, notes } = data;

  // Calculate totals
  let subtotal = 0;
  items.forEach(item => {
    subtotal += item.rate * item.qty;
  });
  const tax = subtotal * 0.2; // 20% VAT
  const total = subtotal + tax;

  return await prisma.invoice.create({
    data: {
      patient_id: patientId,
      date: new Date(date),
      subtotal,
      tax,
      total,
      notes,
      status: 'PENDING',
      items: {
        create: items.map(item => ({
          service: item.service,
          rate: item.rate,
          qty: item.qty
        }))
      }
    },
    include: {
      items: true,
      patient: true
    }
  });
};

const deleteInvoice = async (id) => {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete items first (Prisma handles relations if defined, but safe here)
  await prisma.invoiceItem.deleteMany({ where: { invoice_id: id } });
  await prisma.payment.deleteMany({ where: { invoice_id: id } });
  
  return await prisma.invoice.delete({ where: { id } });
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  getInvoiceDownloadPayload,
  createInvoice,
  deleteInvoice
};
