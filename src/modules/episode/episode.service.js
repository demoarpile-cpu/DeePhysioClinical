const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getEpisodesByPatientId = async (patientId) => {
  return await prisma.episode.findMany({
    where: { patient_id: parseInt(patientId) },
    orderBy: { created_at: 'desc' }
  });
};

const createEpisode = async (data) => {
  const { patientId, title, description } = data;

  // Transaction to prevent race condition
  return await prisma.$transaction(async (tx) => {
    // Check for existing active episode (end_date is NULL)
    const activeEpisode = await tx.episode.findFirst({
      where: {
        patient_id: parseInt(patientId),
        end_date: null
      }
    });

    if (activeEpisode) {
      throw new Error('Active episode already exists for this patient');
    }

    return await tx.episode.create({
      data: {
        patient_id: parseInt(patientId),
        title,
        description
      }
    });
  });
};

const endEpisode = async (id, endDate) => {
  return await prisma.episode.update({
    where: { id: parseInt(id) },
    data: {
      end_date: new Date(endDate)
    }
  });
};

module.exports = {
  getEpisodesByPatientId,
  createEpisode,
  endEpisode
};
