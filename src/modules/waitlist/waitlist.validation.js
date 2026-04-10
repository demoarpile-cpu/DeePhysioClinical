const Joi = require('joi');

/**
 * Validate waitlist creation data
 * @param {Object} data - Waitlist data to validate
 * @returns {Object} Validation result
 */
const createWaitlistValidation = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),

    service: Joi.string().trim().required(),
    preferredDate: Joi.date().iso().allow(null, '').optional(),
    preferredTime: Joi.string().trim().allow(null, '').optional(),
    contactNumber: Joi.string().trim().required(),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').uppercase().optional()
  }).unknown(false); // Reject unknown fields as per request

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
  createWaitlistValidation,
  paramIdValidation
};
