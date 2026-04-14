const Joi = require('joi');

const emergencyContactSchema = Joi.object({
  name: Joi.string().trim().allow('', null).optional(),
  phone: Joi.string().trim().allow('', null).optional(),
  relation: Joi.string().trim().allow('', null).optional()
}).optional();

/**
 * Validate patient creation data
 * @param {Object} data - Patient data to validate
 * @returns {Object} Validation result
 */
const createPatientValidation = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(2).required(),
    lastName: Joi.string().trim().min(2).required(),
    phone: Joi.string().trim().min(10).max(15).required(),
    email: Joi.string().email().trim().allow(null, '').optional(),
    gender: Joi.string().valid('male', 'female', 'other').lowercase().allow(null, '').optional(),
    dateOfBirth: Joi.date().allow(null, '').optional(),
    address: Joi.string().trim().allow(null, '').optional(),
    patientType: Joi.string().trim().allow(null, '').optional(),
    behaviour: Joi.string().trim().allow(null, '').optional(),
    therapistId: Joi.number().integer().allow(null).optional(),
    emergencyContact: emergencyContactSchema
  }).unknown(true);

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate patient update data
 * @param {Object} data - Patient data to validate
 * @returns {Object} Validation result
 */
const updatePatientValidation = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(2).optional(),
    lastName: Joi.string().trim().min(2).optional(),
    phone: Joi.string().trim().min(10).max(15).optional(),
    email: Joi.string().email().trim().allow(null, '').optional(),
    gender: Joi.string().valid('male', 'female', 'other').allow(null, '').optional(),
    dateOfBirth: Joi.date().allow(null, '').optional(),
    address: Joi.string().trim().allow(null, '').optional(),
    patientType: Joi.string().trim().allow(null, '').optional(),
    behaviour: Joi.string().trim().allow(null, '').optional(),
    therapistId: Joi.number().integer().allow(null).optional(),
    isActive: Joi.boolean().optional(),
    allowSms: Joi.boolean().optional(),
    allowEmail: Joi.boolean().optional(),
    allowNotifications: Joi.boolean().optional(),
    emergencyContact: emergencyContactSchema
  }).unknown(true);

  return schema.validate(data, { abortEarly: false });
};

const upsertMedicalHistoryValidation = (data) => {
  const schema = Joi.object({
    existingConditions: Joi.string().allow('', null).optional(),
    allergies: Joi.string().allow('', null).optional(),
    chronicDiseases: Joi.string().allow('', null).optional(),
    surgeries: Joi.string().allow('', null).optional(),
    longTermNotes: Joi.string().allow('', null).optional()
  }).unknown(false);

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
  createPatientValidation,
  updatePatientValidation,
  upsertMedicalHistoryValidation,
  paramIdValidation
};