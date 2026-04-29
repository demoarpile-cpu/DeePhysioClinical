const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess } = require('../auth/actionAccess.middleware');
const { authorizeRoles } = require('../auth/role.middleware');

router.get('/overview', verifyToken, requireActionAccess('analytics.view'), analyticsController.getOverview);
router.get('/activity', verifyToken, requireActionAccess('analytics.view'), analyticsController.getActivities);
router.get('/staff', verifyToken, requireActionAccess('analytics.view'), authorizeRoles('admin'), analyticsController.getStaffOverview);
router.get('/room-income', verifyToken, authorizeRoles('admin', 'billing', 'therapist'), analyticsController.getRoomIncome);

module.exports = router;
