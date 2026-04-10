const prisma = require('../../config/prisma');

const getAllAttachments = async (filters) => {
  const { patientId } = filters;
  const where = {};

  if (patientId) where.patient_id = parseInt(patientId, 10);

  return await prisma.attachment.findMany({
    where,
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } }
    },
    orderBy: { upload_date: 'desc' }
  });
};

const getAttachmentById = async (id) => {
  const attachment = await prisma.attachment.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } }
    }
  });

  if (!attachment) {
    const error = new Error('Attachment not found');
    error.statusCode = 404;
    throw error;
  }

  return attachment;
};

const createAttachment = async (data) => {
  return await prisma.attachment.create({
    data: {
      name: data.name,
      patient_id: parseInt(data.patientId, 10),
      size: data.size,
      type: data.type
    },
    include: {
      patient: true
    }
  });
};

const deleteAttachment = async (id) => {
  return await prisma.attachment.delete({
    where: { id: parseInt(id, 10) }
  });
};

module.exports = {
  getAllAttachments,
  getAttachmentById,
  createAttachment,
  deleteAttachment
};
