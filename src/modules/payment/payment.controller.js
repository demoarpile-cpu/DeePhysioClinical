const paymentService = require('./payment.service');
const { logActivity } = require('../../utils/activityLogger');

const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments(req.query);
    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const id = req.params.id;
    const payment = await paymentService.getPaymentById(id);
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const createPayment = async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    await logActivity(
      req.user?.id, 
      'PAY_INVOICE', 
      payment.invoice_id, 
      'Invoice', 
      `Payment of £${payment.amount} recorded`,
      { entity: 'Invoice', entityId: payment.invoice_id, label: `Payment £${payment.amount}` }
    );
    return res.status(201).json({ success: true, data: payment, message: "Payment recorded successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const deletePayment = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedPayment = await paymentService.deletePayment(id);
    await logActivity(
      req.user?.id,
      'UPDATE_SETTINGS',
      deletedPayment.id,
      'Payment',
      `delete_payment: ${deletedPayment.id}`,
      { action: 'delete_payment', entity: 'Payment', entityId: deletedPayment.id, invoiceId: deletedPayment.invoice_id }
    );
    return res.status(200).json({ success: true, data: deletedPayment, message: "Payment record deleted successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  deletePayment
};
