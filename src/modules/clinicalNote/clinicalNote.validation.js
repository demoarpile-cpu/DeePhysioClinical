const Joi = require('joi');

const createClinicalNoteValidation = (data) => {
  const schema = Joi.object({
    patientId: Joi.number().integer().required(),
    therapistId: Joi.number().integer().required(),
    type: Joi.string().trim().required(),
    date: Joi.date().iso().required(),
    status: Joi.string().valid('Draft', 'Completed').optional().default('Draft'),
    subjective: Joi.string().trim().allow(null, '').optional(),
    objective: Joi.string().trim().allow(null, '').optional(),
    assessment: Joi.string().trim().allow(null, '').optional(),
    plan: Joi.string().trim().allow(null, '').optional()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const updateClinicalNoteValidation = (data) => {
  const schema = Joi.object({
    type: Joi.string().trim().optional(),
    date: Joi.date().iso().optional(),
    status: Joi.string().valid('Draft', 'Completed').optional(),
    subjective: Joi.string().trim().allow(null, '').optional(),
    objective: Joi.string().trim().allow(null, '').optional(),
    assessment: Joi.string().trim().allow(null, '').optional(),
    plan: Joi.string().trim().allow(null, '').optional()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const paramIdValidation = (params) => {
  const schema = Joi.object({
    id: Joi.string().guid({ version: ['uuidv4'] }).required()
  });

  return schema.validate(params, { abortEarly: false });
};

module.exports = {
  createClinicalNoteValidation,
  updateClinicalNoteValidation,
  paramIdValidation
};
