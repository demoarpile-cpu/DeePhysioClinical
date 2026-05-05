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
      responses: typeof data.responses === 'string' ? data.responses : JSON.stringify(data.responses),
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
  const submissions = await prisma.formSubmission.findMany({
    where: { patient_id: parseInt(patientId, 10) },
    include: {
      form_template: true
    },
    orderBy: { created_at: 'desc' }
  });
  
  return submissions.map(sub => {
    if (sub.responses && typeof sub.responses === 'string') {
      try { sub.responses = JSON.parse(sub.responses); } catch(e) {}
    }
    return sub;
  });
};

/**
 * Get a single submission by ID
 * @param {Number} id 
 */
const getSubmissionById = async (id) => {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      form_template: true,
      patient: true
    }
  });

  if (submission && submission.responses && typeof submission.responses === 'string') {
    try { submission.responses = JSON.parse(submission.responses); } catch(e) {}
  }
  
  return submission;
};

module.exports = {
  createSubmission,
  getSubmissionsByPatientId,
  getSubmissionById
};
