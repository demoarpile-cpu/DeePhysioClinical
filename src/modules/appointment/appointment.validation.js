const Joi = require('joi');

const createAppointmentValidation = (data) => {
  const schema = Joi.object({
    patientId: Joi.number().required(),
    therapistId: Joi.number().required(),
    appointmentDate: Joi.date().iso().required(),
    serviceId: Joi.number().integer().optional(),
    room: Joi.string().trim().allow(null, '').optional(),
    notes: Joi.string().trim().allow(null, '').optional(),
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const updateAppointmentValidation = (data) => {
  const schema = Joi.object({
    appointmentDate: Joi.date().iso().optional(),
    therapistId: Joi.number().integer().optional(),
    serviceId: Joi.number().integer().optional(),
    room: Joi.string().trim().optional(),
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional(),
    notes: Joi.string().trim().allow(null, '').optional()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const updateStatusValidation = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show').required()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const paramIdValidation = (params) => {
  const schema = Joi.object({
    id: Joi.number().integer().required()
  });

  return schema.validate(params, { abortEarly: false });
};

module.exports = {
  createAppointmentValidation,
  updateAppointmentValidation,
  updateStatusValidation,
  paramIdValidation
};
