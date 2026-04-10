const Joi = require('joi');

const createAttachmentValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    patientId: Joi.number().integer().required(),
    size: Joi.string().required(),
    type: Joi.string().valid('PDF', 'Image', 'DOCX', 'Other').required()
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
  createAttachmentValidation,
  paramIdValidation
};
