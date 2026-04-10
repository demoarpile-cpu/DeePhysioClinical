const Joi = require('joi');

const createEpisodeSchema = Joi.object({
  patientId: Joi.number().integer().required(),
  title: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().trim().allow('', null).max(1000)
});

const endEpisodeSchema = Joi.object({
  endDate: Joi.date().iso().required()
});

module.exports = {
  createEpisodeSchema,
  endEpisodeSchema
};
