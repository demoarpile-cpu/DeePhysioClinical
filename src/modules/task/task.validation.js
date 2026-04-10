const Joi = require('joi');

/**
 * Validate task creation data
 * @param {Object} data - Task data to validate
 * @returns {Object} Validation result
 */
const createTaskValidation = (data) => {
  const schema = Joi.object({
    patientId: Joi.number().integer().required(),
    title: Joi.string().trim().min(3).required(),
    description: Joi.string().trim().allow(null, '').optional(),
    dueDate: Joi.date().allow(null, '').optional()
  }).unknown(true);

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate task update data
 * @param {Object} data - Task data to validate
 * @returns {Object} Validation result
 */
const updateTaskValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(3).optional(),
    description: Joi.string().trim().allow(null, '').optional(),
    status: Joi.string().valid('pending', 'done').optional(),
    dueDate: Joi.date().allow(null, '').optional()
  }).unknown(true);

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate param ID (must be integer)
 * @param {Object} params - Route params
 * @returns {Object} Validation result
 */
const paramIdValidation = (params) => {
  const schema = Joi.object({
    id: Joi.number().integer().required()
  });

  return schema.validate(params, { abortEarly: false });
};

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  paramIdValidation
};
