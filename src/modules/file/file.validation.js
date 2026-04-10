const Joi = require('joi');

/**
 * Validate file metadata creation
 * @param {Object} data - File data
 */
const createFileValidation = (data) => {
  const schema = Joi.object({
    patientId: Joi.number().integer().required(),
    fileName: Joi.string().trim().required(),
    fileUrl: Joi.string().trim().uri().required(),
    fileType: Joi.string().trim().required()
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  createFileValidation
};
