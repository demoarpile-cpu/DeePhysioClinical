const Joi = require('joi');

const createPaymentValidation = (data) => {
  const schema = Joi.object({
    patient_id: Joi.number().integer().required(),
    invoice_id: Joi.string().uuid().optional().allow(null),
    amount: Joi.number().greater(0).required(),
    date: Joi.date().required(),
    method: Joi.string().trim().optional().allow(''),
    status: Joi.string().valid('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED').default('COMPLETED'),
    description: Joi.string().trim().optional().allow('')
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const paramIdValidation = (params) => {
  const schema = Joi.object({
    id: Joi.string().uuid().required()
  });

  return schema.validate(params, { abortEarly: false });
};

module.exports = {
  createPaymentValidation,
  paramIdValidation
};
