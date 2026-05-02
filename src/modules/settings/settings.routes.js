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
    let settings;

    if (!keysStr) {
      settings = await prisma.globalSettings.findMany();
    } else {
      const keys = keysStr.split(',');
      settings = await prisma.globalSettings.findMany({
        where: { key: { in: keys } }
      });
    }

    const settingsMap = {};
    settings.forEach(s => { 
      try {
        // Try to parse JSON if it looks like an object/array
        if (s.value && (s.value.startsWith('{') || s.value.startsWith('['))) {
          settingsMap[s.key] = JSON.parse(s.value);
        } else {
          settingsMap[s.key] = s.value;
        }
      } catch (e) {
        settingsMap[s.key] = s.value;
      }
    });

    res.json({ success: true, data: settingsMap });
  } catch (error) {
    next(error);
  }
});

// POST update settings
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
      // Ensure complex values are stringified for DB storage
      const dbValue = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : String(val);
      
      updates.push(
        prisma.globalSettings.upsert({
          where: { key },
          update: { value: dbValue },
          create: { key, value: dbValue }
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
