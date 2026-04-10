const express = require('express');
const router = express.Router();
const bodyChartController = require('./bodyChart.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');

// GET /api/body-charts?patientId=ID
router.get('/', verifyToken, authorizeRoles('admin', 'therapist'), bodyChartController.getBodyCharts);
router.put('/:id', verifyToken, authorizeRoles('admin', 'therapist'), bodyChartController.updateBodyChart);

module.exports = router;
