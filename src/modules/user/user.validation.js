const Joi = require('joi');
const { MODULES } = require('../../config/moduleAccess');
const { PERMISSIONS, LEGACY_ACTIONS } = require('../../config/actionAccess');

const createUserValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'therapist', 'receptionist', 'billing').required(),
    allowed_menus: Joi.array().items(Joi.string().valid(...MODULES)).optional(),
    allowed_permissions: Joi.array().items(Joi.string().valid(...PERMISSIONS)).optional(),
    allowed_actions: Joi.array().items(Joi.string().valid(...LEGACY_ACTIONS)).optional(),
    plain_password: Joi.string().allow('', null).optional()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  createUserValidation
};
