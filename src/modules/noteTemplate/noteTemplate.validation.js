const Joi = require('joi');

const noteTemplateSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Template title must be at least 3 characters long.',
    'string.empty': 'Template title is required.'
  }),
  category: Joi.string().required().messages({
    'string.empty': 'Category is required.'
  }),
  content: Joi.alternatives().try(
    Joi.object(),
    Joi.array().items(
      Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
        title: Joi.string().required(),
        placeholder: Joi.string().allow('', null)
      })
    )
  ).required().messages({
    'any.required': 'Template content is required.',
  }),
  isCustom: Joi.boolean().optional()
});

module.exports = {
  noteTemplateSchema
};
