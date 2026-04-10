const Joi = require('joi');

const updateSettingsSchema = Joi.object({
  settings: Joi.object().pattern(
    Joi.string(),
    Joi.any()
  ).required().messages({
    'object.base': 'Settings must be an object of key-value pairs.',
    'any.required': 'Settings map is required.'
  })
});

module.exports = {
  updateSettingsSchema
};
