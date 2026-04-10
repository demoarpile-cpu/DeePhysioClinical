const fileService = require('./file.service');
const { createFileValidation } = require('./file.validation');

/**
 * Get all files for a patient
 */
const getFiles = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    const files = await fileService.getFilesByPatientId(parseInt(patientId));
    res.json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
};

/**
 * Save new file metadata
 */
const createFile = async (req, res, next) => {
  try {
    const { error } = createFileValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join(', ')
      });
    }

    const file = await fileService.createFile(req.body);
    res.status(201).json({ success: true, data: file });
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Invalid file id' });
    }

    await fileService.deleteFile(id);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFiles,
  createFile,
  deleteFile
};
