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
  const { patientId, therapistId, type, date, status, subjective, objective, assessment, plan, dynamic_content, dynamicContent } = data;
  const normalizedDynamicContent = dynamic_content !== undefined ? dynamic_content : dynamicContent;

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

  // If Completed, at least one clinical field is required
  if (noteStatus === 'Completed') {
    const hasContent = (subjective && subjective.trim()) ||
      (objective && objective.trim()) ||
      (assessment && assessment.trim()) ||
      (plan && plan.trim()) ||
      (normalizedDynamicContent && Object.keys(normalizedDynamicContent).length > 0);
    if (!hasContent) {
      const error = new Error('Clinical note is empty. Please enter some findings or use a dynamic template.');
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
      plan: plan || null,
      dynamic_content: normalizedDynamicContent || null
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

  const { type, date, status, subjective, objective, assessment, plan, dynamic_content, dynamicContent } = data;
  const normalizedDynamicContent = dynamic_content !== undefined ? dynamic_content : dynamicContent;

  // Determine final status (incoming or existing)
  const finalStatus = status !== undefined ? status : note.status;

  // If Completed, at least one clinical field must be present (incoming or existing)
  if (finalStatus === 'Completed') {
    const finalSubjective = subjective !== undefined ? subjective : note.subjective;
    const finalObjective = objective !== undefined ? objective : note.objective;
    const finalAssessment = assessment !== undefined ? assessment : note.assessment;
    const finalPlan = plan !== undefined ? plan : note.plan;
    const finalDynamic = normalizedDynamicContent !== undefined ? normalizedDynamicContent : note.dynamic_content;

    const hasContent = (finalSubjective && finalSubjective.trim()) ||
      (finalObjective && finalObjective.trim()) ||
      (finalAssessment && finalAssessment.trim()) ||
      (finalPlan && finalPlan.trim()) ||
      (finalDynamic && Object.keys(finalDynamic).length > 0);

    if (!hasContent) {
      const error = new Error('Clinical note is empty. Please enter some findings or use a dynamic template.');
      error.statusCode = 400;
      throw error;
    }
  }

  const updateData = {};
  if (type !== undefined) updateData.type = type;
  if (date !== undefined) updateData.date = new Date(date);
  if (status !== undefined) updateData.status = status;
  if (subjective !== undefined) updateData.subjective = subjective || null;
  if (objective !== undefined) updateData.objective = objective || null;
  if (assessment !== undefined) updateData.assessment = assessment || null;
  if (plan !== undefined) updateData.plan = plan || null;
  if (normalizedDynamicContent !== undefined) updateData.dynamic_content = normalizedDynamicContent || null;

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
