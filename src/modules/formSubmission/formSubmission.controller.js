const submissionService = require('./formSubmission.service');

/**
 * Handle form submission creation
 */
const createSubmission = async (req, res) => {
  try {
    const submission = await submissionService.createSubmission(req.body);
    res.status(201).json({
      success: true,
      data: submission,
      message: 'Assessment finalized and synchronized'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all submissions for a patient
 */
const getPatientSubmissions = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }
    const submissions = await submissionService.getSubmissionsByPatientId(patientId);
    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a single submission by ID
 */
const getSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await submissionService.getSubmissionById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createSubmission,
  getPatientSubmissions,
  getSubmission
};
