const Joi = require('joi');

const fieldSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(
    'short', 'text', 'date', 'select', 'dropdown', 'checkbox', 
    'single_choice', 'signature', 'import', 'heading', 
    'helper_text', 'horizontal_line'
  ).required(),
  label: Joi.string().allow('').required(),
  required: Joi.boolean().required(),
  placeholder: Joi.string().allow('').optional(),
  options: Joi.array().items(Joi.string()).optional()
});

const layoutSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid('full', 'split').required(),
  fields: Joi.array().items(fieldSchema.allow(null)).required()
});

const createTemplateValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    fields: Joi.array().items(fieldSchema).min(1).required(),
    layouts: Joi.array().items(layoutSchema).optional()
  }).unknown(true);

  return schema.validate(data, { abortEarly: false });
};

const updateTemplateValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().optional(),
    category: Joi.string().optional(),
    fields: Joi.array().items(fieldSchema).min(1).optional(),
    layouts: Joi.array().items(layoutSchema).optional()
  }).unknown(true);

  return schema.validate(data, { abortEarly: false });
};

const paramIdValidation = (params) => {
  const schema = Joi.object({
    id: Joi.number().integer().required()
  });

  return schema.validate(params, { abortEarly: false });
};

module.exports = {
  createTemplateValidation,
  updateTemplateValidation,
  paramIdValidation
};
