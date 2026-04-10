const express = require('express');
const router = express.Router();
const fileController = require('./file.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');

// GET /api/files?patientId=ID
router.get('/', verifyToken, authorizeRoles('admin', 'therapist', 'receptionist'), fileController.getFiles);

// POST /api/files
router.post('/', verifyToken, authorizeRoles('admin', 'therapist', 'receptionist'), fileController.createFile);

// DELETE /api/files/:id
router.delete('/:id', verifyToken, authorizeRoles('admin', 'therapist', 'receptionist'), fileController.deleteFile);

module.exports = router;
