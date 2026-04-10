const prisma = require('../../config/prisma');

const getAllPayments = async (filters) => {
  const { patientId, invoiceId } = filters;
  const where = {};

  if (patientId) where.patient_id = parseInt(patientId, 10);
  if (invoiceId) where.invoice_id = invoiceId;

  return await prisma.payment.findMany({
    where,
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } },
      invoice: true
    },
    orderBy: { date: 'desc' }
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
  const { patient_id, invoice_id, amount, date, method, status, description } = data;

  return await prisma.payment.create({
    data: {
      patient_id,
      invoice_id,
      amount,
      date: new Date(date),
      method,
      status,
      description
    },
    include: {
      patient: true,
      invoice: true
    }
  });
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
