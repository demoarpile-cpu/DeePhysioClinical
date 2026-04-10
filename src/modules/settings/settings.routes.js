const express = require('express');
const router = express.Router();
const prisma = require('../../config/prisma');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');
const { updateSettingsSchema } = require('./settings.validation');

// GET settings by keys
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const keysStr = req.query.keys;
    
    if (!keysStr) {
      // Return all settings if no keys requested
      const allSettings = await prisma.globalSettings.findMany();
      const settingsMap = {};
      allSettings.forEach(s => { settingsMap[s.key] = s.value });
      return res.json({ success: true, data: settingsMap });
    }

    const keys = keysStr.split(',');
    const settings = await prisma.globalSettings.findMany({
      where: { key: { in: keys } }
    });

    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value });

    res.json({ success: true, data: settingsMap });
  } catch (error) {
    next(error);
  }
});

// POST update settings
// Note: We use the global role check because 'therapist' might need to update custom note templates in settings,
// but for standard settings, authorizeRoles('admin', 'therapist') works.
router.post('/', verifyToken, authorizeRoles('admin', 'therapist', 'receptionist', 'billing'), async (req, res, next) => {
  try {
    const { error, value } = updateSettingsSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details.map(d => d.message).join(', ') 
      });
    }

    const { settings } = value;

    const updates = [];
    for (const [key, val] of Object.entries(settings)) {
      updates.push(
        prisma.globalSettings.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val }
        })
      );
    }

    await prisma.$transaction(updates);

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
