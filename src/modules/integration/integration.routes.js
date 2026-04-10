const express = require('express');
const { authorizeRoles } = require('../auth/role.middleware');
const {
  createIntegrationSchema,
  updateIntegrationSchema,
  connectIntegrationSchema,
  toggleIntegrationSchema
} = require('./integration.validation');
const integrationService = require('./integration.service');

const router = express.Router();

router.use(authorizeRoles('admin'));

router.get('/', async (req, res, next) => {
  try {
    const clinicId = req.query.clinicId ? Number(req.query.clinicId) : undefined;
    const data = await integrationService.listIntegrations({ clinicId });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = createIntegrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: error.details.map((d) => d.message).join(', ') });
    }
    const data = await integrationService.createIntegration(value);
    return res.status(201).json({ success: true, data, message: 'Integration added successfully' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateIntegrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: error.details.map((d) => d.message).join(', ') });
    }
    const data = await integrationService.updateIntegration(req.params.id, value);
    return res.json({ success: true, data, message: 'Integration updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/connect', async (req, res, next) => {
  try {
    const { error, value } = connectIntegrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: error.details.map((d) => d.message).join(', ') });
    }
    const data = await integrationService.connectIntegration(req.params.id, value);
    return res.json({ success: true, data, message: 'Integration connected successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/disconnect', async (req, res, next) => {
  try {
    const { error, value } = toggleIntegrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: error.details.map((d) => d.message).join(', ') });
    }
    const data = await integrationService.disconnectIntegration(req.params.id, value);
    return res.json({ success: true, data, message: 'Integration disconnected successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/enable', async (req, res, next) => {
  try {
    const { error, value } = toggleIntegrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: error.details.map((d) => d.message).join(', ') });
    }
    const data = await integrationService.setEnabledState(req.params.id, true, value);
    return res.json({ success: true, data, message: 'Integration enabled successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/disable', async (req, res, next) => {
  try {
    const { error, value } = toggleIntegrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: error.details.map((d) => d.message).join(', ') });
    }
    const data = await integrationService.setEnabledState(req.params.id, false, value);
    return res.json({ success: true, data, message: 'Integration disabled successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
