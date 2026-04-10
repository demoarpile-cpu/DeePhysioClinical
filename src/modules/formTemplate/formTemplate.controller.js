const templateService = require('./formTemplate.service');

const getAllTemplates = async (req, res) => {
  try {
    // 🔥 Self-healing seed for demo environment (Safe execution)
    try {
      await templateService.seedTemplates();
    } catch (seedError) {
      console.warn("Seeding templates bypassed:", seedError.message);
    }
    
    const templates = await templateService.getAllTemplates();
    return res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error("Clinical Forms Fetch Error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to synchronize clinical laboratory library." });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const createTemplate = async (req, res) => {
  try {
    const template = await templateService.createTemplate(req.body);
    return res.status(201).json({ success: true, data: template, message: "Form template created successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body);
    return res.status(200).json({ success: true, data: template, message: "Form template updated successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const deleted = await templateService.deleteTemplate(req.params.id);
    return res.status(200).json({ success: true, data: deleted, message: "Form template deleted successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
