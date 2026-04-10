const taskService = require('./task.service');
const { createTaskValidation, updateTaskValidation, paramIdValidation } = require('./task.validation');

/**
 * Get tasks for a patient
 */
const getTasks = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    
    if (!patientId) {
      const error = new Error('patientId is required');
      error.statusCode = 400;
      throw error;
    }

    const tasks = await taskService.getTasksByPatientId(patientId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 */
const createTask = async (req, res, next) => {
  try {
    const { error } = createTaskValidation(req.body);
    if (error) {
      const err = new Error(error.details.map(d => d.message).join(', '));
      err.statusCode = 400;
      throw err;
    }

    const task = await taskService.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task by ID
 */
const updateTask = async (req, res, next) => {
  try {
    // Validate ID
    const { error: idError } = paramIdValidation(req.params);
    if (idError) {
      const err = new Error('Invalid task ID');
      err.statusCode = 400;
      throw err;
    }

    // Validate body
    const { error: bodyError } = updateTaskValidation(req.body);
    if (bodyError) {
      const err = new Error(bodyError.details.map(d => d.message).join(', '));
      err.statusCode = 400;
      throw err;
    }

    const task = await taskService.updateTask(req.params.id, req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask
};
