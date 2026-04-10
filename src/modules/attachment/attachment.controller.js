const attachmentService = require('./attachment.service');

const getAllAttachments = async (req, res) => {
  try {
    const attachments = await attachmentService.getAllAttachments(req.query);
    return res.status(200).json({ success: true, data: attachments });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const getAttachmentById = async (req, res) => {
  try {
    const attachment = await attachmentService.getAttachmentById(req.params.id);
    return res.status(200).json({ success: true, data: attachment });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const createAttachment = async (req, res) => {
  try {
    const attachment = await attachmentService.createAttachment(req.body);
    return res.status(201).json({ success: true, data: attachment, message: "Attachment uploaded successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const deleted = await attachmentService.deleteAttachment(req.params.id);
    return res.status(200).json({ success: true, data: deleted, message: "Attachment deleted successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

module.exports = {
  getAllAttachments,
  getAttachmentById,
  createAttachment,
  deleteAttachment
};
