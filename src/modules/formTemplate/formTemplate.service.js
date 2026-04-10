const prisma = require('../../config/prisma');

const getAllTemplates = async () => {
  return await prisma.formTemplate.findMany({
    orderBy: { name: 'asc' }
  });
};

const getTemplateById = async (id) => {
  const template = await prisma.formTemplate.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!template) {
    const error = new Error('Form template not found');
    error.statusCode = 404;
    throw error;
  }

  return template;
};

const createTemplate = async (data) => {
  return await prisma.formTemplate.create({
    data: {
      name: data.name,
      category: data.category,
      fields: data.fields
    }
  });
};

const updateTemplate = async (id, data) => {
  return await prisma.formTemplate.update({
    where: { id: parseInt(id, 10) },
    data: {
      name: data.name,
      category: data.category,
      fields: data.fields
    }
  });
};

const deleteTemplate = async (id) => {
  return await prisma.formTemplate.delete({
    where: { id: parseInt(id, 10) }
  });
};

const seedTemplates = async () => {
  const count = await prisma.formTemplate.count();
  if (count > 0) return;

  const defaults = [
    {
      name: 'General Patient Intake',
      category: 'Patient Intake',
      fields: [
        { id: 'f1', type: 'short', label: 'Full Name', required: true },
        { id: 'f2', type: 'date', label: 'Date of Birth', required: true },
        { id: 'f3', type: 'short', label: 'Phone Number', required: true },
        { id: 'f4', type: 'text', label: 'Current Symptoms', required: false },
      ]
    },
    {
      name: 'Physiotherapy Consent',
      category: 'Consent',
      fields: [
        { id: 'c1', type: 'text', label: 'Treatment Risks Acknowledgement', required: true },
        { id: 'c2', type: 'short', label: 'Patient Signature Name', required: true },
        { id: 'c3', type: 'date', label: 'Signed Date', required: true },
      ]
    },
    {
      name: 'Initial Assessment (MSK)',
      category: 'Assessment',
      fields: [
        { id: 'a1', type: 'text', label: 'History of Presenting Complaint', required: true },
        { id: 'a2', type: 'text', label: 'Past Medical History', required: false },
        { id: 'a3', type: 'text', label: 'Objective Findings', required: true },
        { id: 'a4', type: 'text', label: 'Treatment Plan', required: true },
      ]
    },
    {
      name: 'Post-Op Rehab Protocol',
      category: 'Rehabilitation',
      fields: [
        { id: 'r1', type: 'short', label: 'Surgery Date', required: true },
        { id: 'r2', type: 'text', label: 'Weeks 1-4 Progress', required: true },
        { id: 'r3', type: 'text', label: 'Home Exercise Adherence', required: true },
      ]
    },
    {
      name: 'Discharge Summary',
      category: 'Discharge',
      fields: [
        { id: 'd1', type: 'text', label: 'Reason for Discharge', required: true },
        { id: 'd2', type: 'text', label: 'Outcome Measures Score', required: true },
        { id: 'd3', type: 'text', label: 'GP Recommendations', required: false },
      ]
    }
  ];

  for (const t of defaults) {
    await prisma.formTemplate.create({ data: t });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  seedTemplates
};
