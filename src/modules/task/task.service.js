const prisma = require('../../config/prisma');

/**
 * Get tasks for a patient
 * @param {Number} patientId - Patient ID
 * @returns {Array} List of tasks
 */
const getTasksByPatientId = async (patientId) => {
  return await prisma.task.findMany({
    where: { patient_id: parseInt(patientId) },
    orderBy: { created_at: 'desc' }
  });
};

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @returns {Object} Created task
 */
const createTask = async (taskData) => {
  const { patientId, title, description, dueDate } = taskData;
  return await prisma.task.create({
    data: {
      patient_id: parseInt(patientId),
      title: title.trim(),
      description: description ? description.trim() : null,
      due_date: dueDate ? new Date(dueDate) : null,
      status: 'pending'
    }
  });
};

/**
 * Update task by ID
 * @param {Number} id - Task ID
 * @param {Object} taskData - Fields to update
 * @returns {Object} Updated task
 */
const updateTask = async (id, taskData) => {
  const { title, description, status, dueDate } = taskData;
  
  // Check if task exists
  const existing = await prisma.task.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existing) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description ? description.trim() : null;
  if (status !== undefined) updateData.status = status;
  if (dueDate !== undefined) updateData.due_date = dueDate ? new Date(dueDate) : null;

  return await prisma.task.update({
    where: { id: parseInt(id) },
    data: updateData
  });
};

module.exports = {
  getTasksByPatientId,
  createTask,
  updateTask
};
