const prisma = require('../../config/prisma');

/**
 * Save a new form submission
 * @param {Object} data 
 */
const createSubmission = async (data) => {
  return await prisma.formSubmission.create({
    data: {
      patient_id: parseInt(data.patientId, 10),
      form_template_id: parseInt(data.templateId, 10),
      responses: data.responses,
    },
    include: {
      form_template: true
    }
  });
};

/**
 * Get all submissions for a specific patient
 * @param {Number} patientId 
 */
const getSubmissionsByPatientId = async (patientId) => {
  return await prisma.formSubmission.findMany({
    where: { patient_id: parseInt(patientId, 10) },
    include: {
      form_template: true
    },
    orderBy: { created_at: 'desc' }
  });
};

/**
 * Get a single submission by ID
 * @param {Number} id 
 */
const getSubmissionById = async (id) => {
  return await prisma.formSubmission.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      form_template: true,
      patient: true
    }
  });
};

module.exports = {
  createSubmission,
  getSubmissionsByPatientId,
  getSubmissionById
};
