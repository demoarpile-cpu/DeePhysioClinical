const Joi = require('joi');

const threadIdParamValidation = (params) => {
  const schema = Joi.object({
    threadId: Joi.number().integer().positive().required()
  });
  return schema.validate(params, { abortEarly: false });
};

const sendMessageValidation = (data) => {
  const schema = Joi.object({
    patientId: Joi.number().integer().positive().required(),
    channel: Joi.string().valid('sms', 'email').default('sms'),
    subject: Joi.string().trim().max(191).allow('', null).optional(),
    body: Joi.string().trim().min(1).max(5000).required()
  }).unknown(false);
  return schema.validate(data, { abortEarly: false });
};

const createCampaignValidation = (data) => {
  const schema = Joi.object({
    channel: Joi.string().valid('sms', 'email').required(),
    message: Joi.string().trim().min(1).max(5000).required(),
    recipients: Joi.array().items(Joi.number().integer().positive()).min(1).max(1000).required()
  }).unknown(false);
  return schema.validate(data, { abortEarly: false });
};

const createTelehealthSessionValidation = (data) => {
  const schema = Joi.object({
    patientId: Joi.number().integer().positive().required(),
    therapistId: Joi.number().integer().positive().optional(),
    startsAt: Joi.date().iso().optional().allow(null)
  }).unknown(false);
  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  threadIdParamValidation,
  sendMessageValidation,
  createCampaignValidation,
  createTelehealthSessionValidation
};
