const Joi = require('joi');

const fieldSchema = Joi.object({
  id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  type: Joi.string().valid(
    'short', 'text', 'date', 'select', 'dropdown', 'checkbox',
    'single_choice', 'import', 'heading',
    'helper_text', 'horizontal_line'
  ).required(),
  label: Joi.string().allow('').required(),
  required: Joi.boolean().optional().default(false),
  placeholder: Joi.string().allow('', null).optional(),
  options: Joi.array().items(Joi.string()).optional()
});

const layoutSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid('full', 'split').required(),
  fields: Joi.array().items(fieldSchema.allow(null)).required()
});

const noteTemplateSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Template title must be at least 3 characters long.',
    'string.empty': 'Template title is required.'
  }),
  category: Joi.string().required().messages({
    'string.empty': 'Category is required.'
  }),
  content: Joi.alternatives().try(
    Joi.object({
      layouts: Joi.array().items(layoutSchema).required()
    }),
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
}).unknown(true);

module.exports = {
  noteTemplateSchema
};
