const invoiceService = require('./invoice.service');
const { logActivity } = require('../../utils/activityLogger');

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getAllInvoices(req.query);
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const payload = await invoiceService.getInvoiceDownloadPayload(req.params.id);
    return res.status(200).json({
      success: true,
      data: payload,
      message: 'Invoice download payload ready'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const createInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    await logActivity(
      req.user?.id, 
      'CREATE_INVOICE', 
      invoice.id, 
      'Invoice', 
      `Invoice #${invoice.id.slice(0,8)} created`,
      { entity: 'Invoice', entityId: invoice.id, label: `Inv #${invoice.id.slice(0,8)}` }
    );
    return res.status(201).json({ success: true, data: invoice, message: "Invoice created successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await invoiceService.deleteInvoice(req.params.id);
    await logActivity(
      req.user?.id,
      'UPDATE_SETTINGS',
      deletedInvoice.id,
      'Invoice',
      `delete_invoice: ${deletedInvoice.id}`,
      { action: 'delete_invoice', entity: 'Invoice', entityId: deletedInvoice.id }
    );
    return res.status(200).json({ success: true, data: deletedInvoice, message: "Invoice deleted successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  downloadInvoice,
  createInvoice,
  deleteInvoice
};
