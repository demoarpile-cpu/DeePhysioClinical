const prisma = require('../../config/prisma');

const includeRelations = {
  patient: { select: { id: true, first_name: true, last_name: true } },
  therapist: { select: { id: true, name: true } }
};

const getAllClinicalNotes = async (filters) => {
  const where = {};

  if (filters.patientId) {
    where.patient_id = parseInt(filters.patientId, 10);
  }

  if (filters.therapistId) {
    where.therapist_id = parseInt(filters.therapistId, 10);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return await prisma.clinicalNote.findMany({
    where,
    include: includeRelations,
    orderBy: { date: 'desc' }
  });
};

const getClinicalNoteById = async (id) => {
  const note = await prisma.clinicalNote.findUnique({
    where: { id },
    include: includeRelations
  });

  if (!note) {
    const error = new Error('Clinical note not found');
    error.statusCode = 404;
    throw error;
  }

  return note;
};

const createClinicalNote = async (data) => {
  const { patientId, therapistId, type, date, status, subjective, objective, assessment, plan } = data;

  // Check patient exists
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // Check therapist exists and role = therapist or admin
  const user = await prisma.user.findUnique({ where: { id: therapistId } });
  if (!user || (user.role !== 'therapist' && user.role !== 'admin')) {
    const error = new Error('Authorized staff not found or user does not have permission to create notes');
    error.statusCode = 400;
    throw error;
  }

  const noteStatus = status || 'Draft';

  // If Completed, at least one SOAP field is required
  if (noteStatus === 'Completed') {
    const hasContent = (subjective && subjective.trim()) || 
                       (objective && objective.trim()) || 
                       (assessment && assessment.trim()) || 
                       (plan && plan.trim());
    if (!hasContent) {
      const error = new Error('At least one clinical finding (subjective, objective, assessment, or plan) is required when status is Completed');
      error.statusCode = 400;
      throw error;
    }
  }

  return await prisma.clinicalNote.create({
    data: {
      patient_id: patientId,
      therapist_id: therapistId,
      type,
      date: new Date(date),
      status: noteStatus,
      subjective: subjective || null,
      objective: objective || null,
      assessment: assessment || null,
      plan: plan || null
    },
    include: includeRelations
  });
};

const updateClinicalNote = async (id, data) => {
  const note = await prisma.clinicalNote.findUnique({ where: { id } });

  if (!note) {
    const error = new Error('Clinical note not found');
    error.statusCode = 404;
    throw error;
  }

  const { type, date, status, subjective, objective, assessment, plan } = data;

  // Determine final status (incoming or existing)
  const finalStatus = status !== undefined ? status : note.status;

  // If Completed, at least one SOAP field must be present (incoming or existing)
  if (finalStatus === 'Completed') {
    const finalSubjective = subjective !== undefined ? subjective : note.subjective;
    const finalObjective = objective !== undefined ? objective : note.objective;
    const finalAssessment = assessment !== undefined ? assessment : note.assessment;
    const finalPlan = plan !== undefined ? plan : note.plan;

    const hasContent = (finalSubjective && finalSubjective.trim()) || 
                       (finalObjective && finalObjective.trim()) || 
                       (finalAssessment && finalAssessment.trim()) || 
                       (finalPlan && finalPlan.trim());

    if (!hasContent) {
      const error = new Error('At least one clinical finding (subjective, objective, assessment, or plan) is required when status is Completed');
      error.statusCode = 400;
      throw error;
    }
  }

  const updateData = {};
  if (type !== undefined)       updateData.type       = type;
  if (date !== undefined)       updateData.date       = new Date(date);
  if (status !== undefined)     updateData.status     = status;
  if (subjective !== undefined) updateData.subjective = subjective || null;
  if (objective !== undefined)  updateData.objective  = objective || null;
  if (assessment !== undefined) updateData.assessment = assessment || null;
  if (plan !== undefined)       updateData.plan       = plan || null;

  return await prisma.clinicalNote.update({
    where: { id },
    data: updateData,
    include: includeRelations
  });
};

const deleteClinicalNote = async (id) => {
  const note = await prisma.clinicalNote.findUnique({ where: { id } });

  if (!note) {
    const error = new Error('Clinical note not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.clinicalNote.delete({ where: { id } });
  return note;
};

module.exports = {
  getAllClinicalNotes,
  getClinicalNoteById,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote
};
