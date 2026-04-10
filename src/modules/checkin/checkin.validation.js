const Joi = require('joi');

const searchAppointmentValidation = (data) => {
  const schema = Joi.object({
    initial: Joi.string().trim().length(1).required(),
    lastName: Joi.string().trim().min(1).required(),
    dob: Joi.date().iso().required()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const markAsArrivedValidation = (data) => {
  const schema = Joi.object({
    appointmentId: Joi.number().required()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  searchAppointmentValidation,
  markAsArrivedValidation
};
