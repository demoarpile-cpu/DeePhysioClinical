const prisma = require('../../config/prisma');

const DEFAULT_BODY_CHARTS = [
  { title: 'Body Chart', image_url: '/bodyChart/Bodychart.jpg', sort_order: 1 },
  { title: 'Body Chart Blank', image_url: '/bodyChart/Bodychart Blank.jpg', sort_order: 2 },
  { title: 'Body Chart Views', image_url: '/bodyChart/Bodychard front back left right.jpg', sort_order: 3 }
];

let hasEnsuredAnnotatedColumn = false;

const ensureAnnotatedImageColumn = async () => {
  if (hasEnsuredAnnotatedColumn) return;
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE body_charts ADD COLUMN IF NOT EXISTS annotated_image LONGTEXT NULL'
    );
    hasEnsuredAnnotatedColumn = true;
  } catch (error) {
    // If DB does not support IF NOT EXISTS, continue and let query surface real errors.
  }
};

const ensureDefaultBodyCharts = async (patientId) => {
  const count = await prisma.bodyChart.count({
    where: { patient_id: parseInt(patientId, 10) }
  });

  if (count > 0) return;

  await prisma.bodyChart.createMany({
    data: DEFAULT_BODY_CHARTS.map((chart) => ({
      patient_id: parseInt(patientId, 10),
      title: chart.title,
      image_url: chart.image_url,
      sort_order: chart.sort_order
    }))
  });
};

const getBodyChartsByPatientId = async (patientId) => {
  await ensureAnnotatedImageColumn();
  await ensureDefaultBodyCharts(patientId);

  return prisma.$queryRaw`
    SELECT id, patient_id, title, image_url, annotated_image, sort_order, created_at, updated_at
    FROM body_charts
    WHERE patient_id = ${parseInt(patientId, 10)}
    ORDER BY sort_order ASC, id ASC
  `;
};

const updateBodyChart = async (id, patientId, payload) => {
  await ensureAnnotatedImageColumn();
  const chart = await prisma.bodyChart.findFirst({
    where: { id: parseInt(id, 10), patient_id: parseInt(patientId, 10) }
  });

  if (!chart) {
    const error = new Error('Body chart not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.$executeRaw`
    UPDATE body_charts
    SET annotated_image = ${payload.annotatedImage || null}, updated_at = NOW(3)
    WHERE id = ${parseInt(id, 10)}
  `;

  const [updated] = await prisma.$queryRaw`
    SELECT id, patient_id, title, image_url, annotated_image, sort_order, created_at, updated_at
    FROM body_charts
    WHERE id = ${parseInt(id, 10)}
    LIMIT 1
  `;

  return updated;
};

module.exports = {
  getBodyChartsByPatientId,
  updateBodyChart
};
