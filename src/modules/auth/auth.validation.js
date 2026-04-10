const Joi = require('joi');
const { PERMISSIONS, LEGACY_ACTIONS } = require('../../config/actionAccess');

const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'therapist', 'receptionist', 'billing').required(),
    allowed_permissions: Joi.array().items(Joi.string().valid(...PERMISSIONS)).optional(),
    allowed_actions: Joi.array().items(Joi.string().valid(...LEGACY_ACTIONS)).optional()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().trim().required(),
    password: Joi.string().required()
  });

  return schema.validate(data, { abortEarly: false });
};

const forgotPasswordValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().trim().required(),
    newPassword: Joi.string().min(6).required()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

const changePasswordValidation = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }).unknown(false);

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  changePasswordValidation
};