const Joi = require('joi');

const configFieldSchema = Joi.object({
  key: Joi.string().trim().required(),
  label: Joi.string().trim().required(),
  type: Joi.string().trim().valid('text', 'password', 'email', 'url', 'select', 'textarea', 'number', 'token').default('text'),
  required: Joi.boolean().default(false),
  secret: Joi.boolean().default(false),
  placeholder: Joi.string().allow('').default(''),
  options: Joi.array().items(Joi.object({
    label: Joi.string().required(),
    value: Joi.alternatives(Joi.string(), Joi.number(), Joi.boolean()).required()
  })).default([])
});

const createIntegrationSchema = Joi.object({
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-_]+$/).required(),
  displayName: Joi.string().trim().required(),
  category: Joi.string().trim().required(),
  description: Joi.string().allow('').optional(),
  authType: Joi.string().valid('API_KEY', 'TOKEN', 'OAUTH2', 'WEBHOOK', 'NONE').required(),
  adapterKey: Joi.string().trim().default('generic'),
  isActive: Joi.boolean().default(true),
  supportsConnect: Joi.boolean().default(true),
  supportsEnable: Joi.boolean().default(true),
  configSchema: Joi.object({
    fields: Joi.array().items(configFieldSchema).default([])
  }).default({ fields: [] })
});

const updateIntegrationSchema = Joi.object({
  displayName: Joi.string().trim(),
  category: Joi.string().trim(),
  description: Joi.string().allow(''),
  authType: Joi.string().valid('API_KEY', 'TOKEN', 'OAUTH2', 'WEBHOOK', 'NONE'),
  adapterKey: Joi.string().trim(),
  isActive: Joi.boolean(),
  supportsConnect: Joi.boolean(),
  supportsEnable: Joi.boolean(),
  configSchema: Joi.object({
    fields: Joi.array().items(configFieldSchema).default([])
  })
}).min(1);

const connectIntegrationSchema = Joi.object({
  clinicId: Joi.number().integer().allow(null),
  config: Joi.object().default({}),
  credentials: Joi.object().default({})
});

const toggleIntegrationSchema = Joi.object({
  clinicId: Joi.number().integer().allow(null)
});

module.exports = {
  createIntegrationSchema,
  updateIntegrationSchema,
  connectIntegrationSchema,
  toggleIntegrationSchema
};
