const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all files for a patient
 * @param {number} patientId - Patient ID
 */
const getFilesByPatientId = async (patientId) => {
  return await prisma.file.findMany({
    where: { patient_id: patientId },
    orderBy: { created_at: 'desc' }
  });
};

/**
 * Create a new file record
 * @param {Object} fileData - File metadata
 */
const createFile = async (fileData) => {
  const { patientId, fileName, fileUrl, fileType } = fileData;

  return await prisma.file.create({
    data: {
      patient_id: parseInt(patientId),
      file_name: fileName,
      file_url: fileUrl,
      file_type: fileType
    }
  });
};

/**
 * Delete file metadata by id
 * @param {number} fileId
 */
const deleteFile = async (fileId) => {
  const existing = await prisma.file.findUnique({
    where: { id: fileId }
  });

  if (!existing) {
    const error = new Error('File not found');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.file.delete({
    where: { id: fileId }
  });
};

module.exports = {
  getFilesByPatientId,
  createFile,
  deleteFile
};
