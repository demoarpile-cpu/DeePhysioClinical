const express = require('express');
const router = express.Router();
const controller = require('./communication.controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');
const {
  threadIdParamValidation,
  sendMessageValidation,
  createCampaignValidation,
  createTelehealthSessionValidation
} = require('./communication.validation');

router.get('/threads', verifyToken, authorizeRoles('admin', 'billing', 'therapist', 'receptionist', 'administrator'), controller.listThreads);
router.post('/threads', verifyToken, authorizeRoles('admin', 'billing', 'administrator'), controller.createThread);
router.get('/threads/:threadId/messages', verifyToken, authorizeRoles('admin', 'billing', 'therapist', 'receptionist', 'administrator'), controller.listMessages);
router.post(
  '/threads/:threadId/messages',
  verifyToken,
  authorizeRoles('admin', 'billing', 'administrator'),
  (req, res, next) => {
    const { error } = threadIdParamValidation(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid thread ID' });
    next();
  },
  (req, res, next) => {
    const { error } = sendMessageValidation(req.body);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    next();
  },
  controller.sendMessage
);

router.get('/campaigns', verifyToken, authorizeRoles('admin', 'billing', 'therapist', 'receptionist'), controller.listCampaigns);
router.post(
  '/campaigns',
  verifyToken,
  authorizeRoles('admin', 'billing', 'administrator'),
  (req, res, next) => {
    const { error } = createCampaignValidation(req.body);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    next();
  },
  controller.createCampaign
);

router.get('/telehealth/sessions', verifyToken, authorizeRoles('admin', 'billing', 'therapist', 'receptionist'), controller.listTelehealthSessions);
router.post(
  '/telehealth/sessions',
  verifyToken,
  authorizeRoles('admin', 'billing', 'therapist', 'administrator'),
  (req, res, next) => {
    const { error } = createTelehealthSessionValidation(req.body);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    next();
  },
  controller.createTelehealthSession
);

router.post('/send-email', verifyToken, authorizeRoles('admin', 'billing', 'therapist', 'receptionist', 'administrator'), upload.single('pdfDocument'), controller.sendDirectEmail);
router.put('/messages/:messageId/flags', verifyToken, authorizeRoles('admin', 'billing', 'therapist', 'receptionist', 'administrator'), controller.updateMessageFlags);

module.exports = router;
