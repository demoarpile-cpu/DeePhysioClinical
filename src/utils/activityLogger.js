const prisma = require('../config/prisma');

/**
 * Safely logs a system activity without crashing the parent request
 * @param {number|null} userId - ID of the user performing the action 
 * @param {string} action - Enum value from SystemActionType
 * @param {string|number} targetId - ID of the primary entity affected
 * @param {string} targetType - Type of entity (Patient, Appointment, Note, etc)
 * @param {string} details - Human readable summary
 * @param {object} meta - Structured metadata { entity, entityId, label }
 */
const logActivity = async (userId, action, targetId = null, targetType = null, details = null, meta = null) => {
  try {
    await prisma.systemActivityLog.create({
      data: {
        user_id: userId ? parseInt(userId, 10) : null,
        action,
        target_id: targetId ? String(targetId) : null,
        target_type: targetType,
        details,
        meta: meta ? JSON.stringify(meta) : null
      }
    });
  } catch (err) {
    // Fail-safe: Log internally but don't crash main thread
    console.error(`[INTERNAL_SYSTEM_LOG_ERROR] Action: ${action} | Error: ${err.message}`);
  }
};

module.exports = {
  logActivity
};
